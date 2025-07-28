from typing import Dict, Any, Optional
from logs.logger import Logger
from model.receitas.receitas_model import ReceitasModel
from util.retornos import Retorno

class ReceitasHandler:
    """Handler para operações CRUD de receitas com gerenciamento de estado"""
    
    def __init__(self, receitas_model: ReceitasModel, logger: Logger):
        """
        Inicializa o handler com:
        - receitas_model: Instância do modelo de receitas
        - logger: Instância do logger
        """
        self.receitas_model = receitas_model
        self.log = logger
        self._receita_selecionada: Optional[Dict[str, Any]] = None

    @property
    def receita_selecionada(self) -> Optional[Dict[str, Any]]:
        """Retorna a receita atualmente selecionada"""
        return self._receita_selecionada

    def obter_receita_por_id(self, receita_id: int) -> Dict[str, Any]:

        """
        Seleciona uma receita para operações futuras
        
        Retorna:
        - Dict[str, Any]: Retorno padronizado com os dados ou erro
        """
        try:
            resultado = self.receitas_model.buscar_receita_completa(receita_id)
            
            if not resultado['ok']:
                self.log.warning(f"Receita ID {receita_id} não encontrada")
                return Retorno.nao_encontrado(f"Receita ID {receita_id} não encontrada")
                
            self._receita_selecionada = resultado['dados']
            self.log.info(f"Receita selecionada - ID: {receita_id}")
            return Retorno.sucesso("Receita selecionada com sucesso", self._receita_selecionada)
            
        except Exception as e:
            self.log.error(f"Erro ao selecionar receita: {str(e)}")
            return Retorno.erro(f"Erro ao selecionar receita: {str(e)}")

    def adicionar_receita(self, dados: Dict[str, Any]) -> Dict[str, Any]:

        """
        Adiciona uma nova receita e seus ingredientes
        
        Retorna:
        - Dict[str, Any]: Retorno padronizado com os dados ou erro
        """
        self.log.debug(f"\nTentando adicionar receita com dados: {dados}")
        
        # Log detalhado dos ingredientes
        if 'ingredientes' in dados:
            self.log.debug(f"\nIngredientes recebidos: {dados['ingredientes']}")
            for i, ingrediente in enumerate(dados['ingredientes'], 1):
                self.log.debug(f"\nIngrediente {i} - Tipo: {type(ingrediente).__name__}, Dados: {ingrediente}")

        # Validação básica
        campos_obrigatorios = ['nome', 'descricao', 'categoria_id', 'modo_preparo']

        for campo in campos_obrigatorios:
            if campo not in dados or not dados[campo]:
                msg = f"Campo obrigatório ausente: {campo}"
                self.log.warning(msg)
                return Retorno.dados_invalidos(msg)

        try:
            # Primeiro, insere a receita
            resultado = self.receitas_model.inserir_receita(dados)
            
            if not resultado['ok']:
                self.log.warning("Falha ao adicionar receita")
                return resultado
                
            receita_id = resultado['dados']['receita_id']
            self.log.info(f"Receita adicionada com sucesso. ID: {receita_id}")
            
            # Depois, insere os ingredientes, se houverem
            if 'ingredientes' in dados and dados['ingredientes']:
                self.log.debug(f"\nInserindo {len(dados['ingredientes'])} ingredientes para a receita {receita_id}")
                
                for i, ingrediente in enumerate(dados['ingredientes'], 1):
                    self.log.debug(f"\nProcessando ingrediente {i}: {ingrediente}")
                    
                    # Converte para dicionário se for um objeto
                    if hasattr(ingrediente, 'to_dict'):
                        ingrediente = ingrediente.to_dict()
                    elif hasattr(ingrediente, '__dict__'):
                        ingrediente = vars(ingrediente)
                    
                    # Mapeia os campos do ingrediente para o formato esperado
                    ingrediente_formatado = {
                        'produto_id': ingrediente.get('id'),
                        'quantidade': ingrediente.get('quantidade', 1),
                        'unidade_medida_id': ingrediente.get('unidade_id')
                    }
                    
                    # Verifica se todos os campos necessários foram mapeados corretamente
                    campos_necessarios = ['produto_id', 'quantidade', 'unidade_medida_id']
                    if not all(ingrediente_formatado.get(k) for k in campos_necessarios):
                        self.log.warning(f"Falha ao mapear campos do ingrediente: {ingrediente}")
                        continue
                        
                    # Insere o ingrediente na receita
                    resultado_ingrediente = self.receitas_model.inserir_ingrediente(receita_id, ingrediente_formatado)
                    if not resultado_ingrediente['ok']:
                        self.log.error(f"Erro ao inserir ingrediente {ingrediente_formatado.get('produto_id')}: {resultado_ingrediente['mensagem']}")
            
            # Atualiza o custo estimado da receita com base nos ingredientes
            self.log.debug("Atualizando custo estimado da receita...")
            resultado_custo = self.receitas_model.atualizar_custo_receita(receita_id)

            if not resultado_custo['ok']:
                self.log.error(f"Erro ao atualizar custo da receita: {resultado_custo['mensagem']}")
            
            return Retorno.sucesso("Receita e ingredientes adicionados com sucesso!", {"receita_id": receita_id})
                
        except Exception as e:
            self.log.error(f"Erro ao adicionar receita: {str(e)}")
            return Retorno.erro(f"Erro ao adicionar receita: {str(e)}")

    def editar_receita(self, novos_dados: Dict[str, Any]) -> Dict[str, Any]:
        """
        Edita a receita selecionada
        
        Retorna:
        - Dict[str, Any]: Retorno padronizado indicando sucesso ou erro

        """
        if not self._receita_selecionada:
            msg = "Nenhuma receita selecionada"
            self.log.warning(msg)
            return Retorno.dados_invalidos(msg)

        try:
            receita_id = self._receita_selecionada['id']
            self.log.debug(f"\nAtualizando receita ID {receita_id}")
            
            # Mescla os dados existentes com os novos
            dados_atualizados = {**self._receita_selecionada, **novos_dados}
            
            resultado = self.receitas_model.atualizar_receita(receita_id, dados_atualizados)
            
            if not resultado['ok']:
                return resultado
                
            self._receita_selecionada = None
            self.log.info(f"Receita ID {receita_id} atualizada com sucesso.")
            return Retorno.sucesso("Receita atualizada com sucesso!")
            
        except Exception as e:
            self.log.error(f"Erro ao editar receita: {str(e)}")
            return Retorno.erro(f"Erro ao editar receita: {str(e)}")

    def excluir_receita(self) -> Dict[str, Any]:
        """
        Exclui a receita selecionada
        
        Retorna:
        - Dict[str, Any]: Retorno padronizado indicando sucesso ou erro
        """
        if not self._receita_selecionada:
            msg = "Nenhuma receita selecionada"
            self.log.warning(msg)
            return Retorno.dados_invalidos(msg)

        try:
            receita_id = self._receita_selecionada['id']
            self.log.debug(f"\nExcluindo receita ID {receita_id}")
            
            resultado = self.receitas_model.excluir_receita(receita_id)
            
            if not resultado['ok']:
                return resultado
                
            self._receita_selecionada = None
            self.log.info(f"Receita ID {receita_id} excluída com sucesso.")
            return Retorno.sucesso("Receita excluída com sucesso!")
            
        except Exception as e:
            self.log.error(f"Erro ao excluir receita: {str(e)}")
            return Retorno.erro(f"Erro ao excluir receita: {str(e)}")

    def limpar_selecao(self) -> Dict[str, Any]:
        """Limpa a receita selecionada"""
        self._receita_selecionada = None
        self.log.debug("Seleção de receita limpa")
        return Retorno.sucesso("Seleção de receita limpa com sucesso")
    
    def get_receita_completa_selecionada(self) -> dict:
        """Obtém a receita atualmente selecionada
        
        Returns:
            dict: Retorno padronizado contendo:
                - ok: bool indicando sucesso/falha
                - mensagem: str descritiva
                - status: código HTTP
                - dados: receita selecionada ou None
        """
        try:
            if not hasattr(self, '_receita_selecionada'):
                msg = "Atributo '_receita_selecionada' não encontrado"
                self.log.error(msg)
                return Retorno.erro(msg)
            
            if self._receita_selecionada is None:
                msg = "Nenhuma receita selecionada atualmente"
                self.log.debug(msg)
                return Retorno.nao_encontrado(msg)
            
            self.log.debug(f"""Retornando receita selecionada 
                receita_id:{ self._receita_selecionada.get('id')} 
                nome:{ self._receita_selecionada.get('nome_receita')}"""
            )         
            
            return Retorno.sucesso(
                "Receita selecionada obtida com sucesso",
                dados=self._receita_selecionada
            )
            
        except Exception as e:
            error_msg = f"Erro ao obter receita selecionada: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)