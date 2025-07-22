from typing import Dict, Any, Optional, Tuple
from logs.logger import Logger
from model.receitas.receitas_model import ReceitasModel

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

    def selecionar_receita(self, receita_id: int) -> Tuple[bool, str]:
        """
        Seleciona uma receita para operações futuras
        
        Retorna:
        - Tuple[bool, str]: (sucesso, mensagem)
        """
        try:
            receita = self.receitas_model.obter_receita_por_id(receita_id)
            if not receita:
                self.log.warning(f"Receita ID {receita_id} não encontrada")
                return False, f"Receita ID {receita_id} não encontrada"
                
            self._receita_selecionada = receita
            self.log.info(f"Receita selecionada - ID: {receita_id}")
            return True, "Receita selecionada com sucesso"
            
        except Exception as e:
            self.log.error(f"Erro ao selecionar receita: {str(e)}")
            return False, f"Erro ao selecionar receita: {str(e)}"

    def adicionar_receita(self, dados: Dict[str, Any]) -> Tuple[bool, str, Optional[int]]:
        """
        Adiciona uma nova receita e seus ingredientes
        
        Retorna:
        - Tuple[bool, str, Optional[int]]: (sucesso, mensagem, receita_id)
        """
        self.log.debug(f"Tentando adicionar receita com dados: {dados}")
        
        # Log detalhado dos ingredientes
        if 'ingredientes' in dados:
            self.log.debug(f"Ingredientes recebidos: {dados['ingredientes']}")
            for i, ingrediente in enumerate(dados['ingredientes'], 1):
                self.log.debug(f"Ingrediente {i} - Tipo: {type(ingrediente).__name__}, Dados: {ingrediente}")
                if hasattr(ingrediente, '__dict__'):
                    self.log.debug(f"Atributos do objeto: {ingrediente.__dict__}")
                elif isinstance(ingrediente, dict):
                    self.log.debug(f"Chaves do dicionário: {list(ingrediente.keys())}")
                
                # Verifica se o ingrediente tem os campos necessários
                campos_necessarios = ['produto_id', 'quantidade', 'unidade_medida_id']
                for campo in campos_necessarios:
                    if hasattr(ingrediente, 'get'):
                        self.log.debug(f"{campo}: {ingrediente.get(campo, 'Não encontrado')}")
                    elif hasattr(ingrediente, campo):
                        self.log.debug(f"{campo}: {getattr(ingrediente, campo, 'Não encontrado')}")
        
        # Validação básica
        campos_obrigatorios = ['nome', 'descricao', 'categoria_id', 'modo_preparo']
        for campo in campos_obrigatorios:
            if campo not in dados or not dados[campo]:
                msg = f"Campo obrigatório ausente: {campo}"
                self.log.warning(msg)
                return False, msg, None

        try:
            # Primeiro, insere a receita
            receita_id = self.receitas_model.inserir_receita(dados)
            
            if not receita_id:
                self.log.warning("Falha ao adicionar receita")
                return False, "Falha ao adicionar receita", None
                
            self.log.info(f"Receita adicionada com sucesso. ID: {receita_id}")
            
            # Depois, insere os ingredientes, se houverem
            if 'ingredientes' in dados and dados['ingredientes']:
                self.log.debug(f"Inserindo {len(dados['ingredientes'])} ingredientes para a receita {receita_id}")
                
                for i, ingrediente in enumerate(dados['ingredientes'], 1):
                    self.log.debug(f"Processando ingrediente {i}: {ingrediente}")
                    
                    # Converte para dicionário se for um objeto
                    if hasattr(ingrediente, 'to_dict'):
                        ingrediente = ingrediente.to_dict()
                    elif hasattr(ingrediente, '__dict__'):
                        ingrediente = vars(ingrediente)
                    
                    # Obtém a quantidade do ingrediente (que está armazenada no card)
                    quantidade = 1
                    if hasattr(ingrediente, 'quantidade'):
                        quantidade = ingrediente.quantidade
                    elif isinstance(ingrediente, dict) and 'quantidade' in ingrediente:
                        quantidade = ingrediente['quantidade']
                    
                    self.log.debug(f"Quantidade do ingrediente: {quantidade}")
                    
                    # Mapeia os campos do ingrediente para o formato esperado
                    ingrediente_formatado = {
                        'produto_id': ingrediente.get('id'),
                        'quantidade': quantidade,
                        'unidade_medida_id': ingrediente.get('unidade_id')
                    }
                    
                    # Verifica se todos os campos necessários foram mapeados corretamente
                    campos_necessarios = ['produto_id', 'quantidade', 'unidade_medida_id']
                    if not all(ingrediente_formatado.get(k) for k in campos_necessarios):
                        self.log.warning(f"Falha ao mapear campos do ingrediente: {ingrediente}")
                        self.log.warning(f"Campos mapeados: {ingrediente_formatado}")
                        continue
                        
                    # Usa o ingrediente formatado
                    ingrediente = ingrediente_formatado
                        
                    # Insere o ingrediente na receita
                    self.log.debug(f"Inserindo ingrediente: {ingrediente}")
                    success, error = self.receitas_model.inserir_ingrediente(receita_id, ingrediente)
                    if not success:
                        self.log.error(f"Erro ao inserir ingrediente {ingrediente.get('produto_id')}: {error}")
                        # Continua mesmo se um ingrediente falhar
                    else:
                        self.log.info(f"Ingrediente {ingrediente.get('produto_id')} inserido com sucesso")
            
            # Atualiza o custo estimado da receita com base nos ingredientes
            self.log.debug("Atualizando custo estimado da receita...")
            success, error = self.receitas_model.atualizar_custo_receita(receita_id)
            if not success:
                self.log.error(f"Erro ao atualizar custo da receita: {error}")
            
            return True, "Receita e ingredientes adicionados com sucesso!", receita_id
                
        except Exception as e:
            self.log.error(f"Erro ao adicionar receita: {str(e)}")
            return False, f"Erro: {str(e)}", None

    def editar_receita(self, novos_dados: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Edita a receita selecionada
        
        Retorna:
        - Tuple[bool, str]: (sucesso, mensagem)
        """
        if not self._receita_selecionada:
            msg = "Nenhuma receita selecionada"
            self.log.warning(msg)
            return False, msg

        try:
            receita_id = self._receita_selecionada['id']
            self.log.debug(f"Atualizando receita ID {receita_id}")
            
            # Mescla os dados existentes com os novos
            dados_atualizados = {**self._receita_selecionada, **novos_dados}
            
            if not self.receitas_model.atualizar(receita_id, dados_atualizados):
                msg = "Falha ao atualizar receita"
                self.log.warning(msg)
                return False, msg
                
            self._receita_selecionada = None
            self.log.info(f"Receita ID {receita_id} atualizada com sucesso.")
            return True, "Receita atualizada com sucesso!"
            
        except Exception as e:
            self.log.error(f"Erro ao editar receita: {str(e)}")
            return False, f"Erro: {str(e)}"

    def excluir_receita(self) -> Tuple[bool, str]:
        """
        Exclui a receita selecionada
        
        Retorna:
        - Tuple[bool, str]: (sucesso, mensagem)
        """
        if not self._receita_selecionada:
            msg = "Nenhuma receita selecionada"
            self.log.warning(msg)
            return False, msg

        try:
            receita_id = self._receita_selecionada['id']
            self.log.debug(f"Excluindo receita ID {receita_id}")
            
            if not self.receitas_model.excluir(receita_id):
                msg = "Falha ao excluir receita"
                self.log.warning(msg)
                return False, msg
                
            self._receita_selecionada = None
            self.log.info(f"Receita ID {receita_id} excluída com sucesso.")
            return True, "Receita excluída com sucesso!"
            
        except Exception as e:
            self.log.error(f"Erro ao excluir receita: {str(e)}")
            return False, f"Erro: {str(e)}"

    def limpar_selecao(self):
        """Limpa a receita selecionada"""
        self._receita_selecionada = None
        self.log.debug("Seleção de receita limpa")