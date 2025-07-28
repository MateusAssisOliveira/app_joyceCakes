import time
from typing import Any, Dict
import simplejson as json

from components.receita_bloco import ReceitaBloco
from controller.page_receitas.controller_receitas_data_handler import ReceitasDataHandler
from controller.page_receitas.controller_receitas_handler import ReceitasHandler
from logs.logger import Logger
import flet as ft

from model.receitas.receitas_model import ReceitasModel
from services.produto.produto_service import ProdutoService
from ui.dialogs.add_receitas.receita_dialog import DialogReceita
from util.retornos import Retorno
from view.receitas.receitas_page_view import ReceitasPageView

class ReceitasPageController:
    def __init__(self, page: ft.Page, receitas_model: ReceitasModel, receitas_view: ReceitasPageView):
        self.page = page
        self.receitas_view = receitas_view
        
        
        
        self.receitas_model = receitas_model
        self.log = Logger()
        self.log.info("Inicializando ReceitasPageController")
        self.receitas_view.create_view()
        self._setup_callbacks()
        self._initialize_handlers()

    def _initialize_handlers(self):
        try:
            self._receitas_Data_Handler = ReceitasDataHandler(self.receitas_model, self.log)
            self._receitas_handler = ReceitasHandler(self.receitas_model, self.log)
            self._bloco_component = ReceitaBloco(self._receitas_handler)
            self.log.info("Handlers inicializados com sucesso")
            return Retorno.sucesso("Handlers inicializados com sucesso")
        except Exception as e:
            error_msg = f"Falha na inicialização: {e}"
            self._handle_error(error_msg)
            return Retorno.erro(error_msg)

    def _setup_callbacks(self):
        self.log.debug("Configurando callbacks da view")
        try:
            self.receitas_view.set_on_buscar(self._handle_busca_receita)
            self.receitas_view.definir_acoes_botoes_navBar({
                'home': lambda: self.page.go('/'),
                'novo': self._handle_nova_receita,
                'editar': self._handle_editar_receita,
                'deletar': self._handle_deletar_receita
            })
            self.receitas_view.definir_acoes_botoes_rodape(self._handle_paginacao_receitas)
            return Retorno.sucesso("Callbacks configurados com sucesso")
        
        except Exception as e:
            error_msg = f"Erro ao configurar callbacks: {e}"
            self._handle_error(error_msg)
            return Retorno.erro(error_msg)
    
    def carregar_dados_receitas(self, pagina: int = 1) -> Dict[str, Any]:
        """Carrega os dados paginados e atualiza a view"""
        try:
            resultado = self._receitas_Data_Handler.listar_receitas_paginadas(pagina=pagina)
            self.log.info(f"Retorno do carregar_dados_receitas: {resultado}")

            if not resultado.get("ok", False):
                error_msg = f"Erro ao carregar dados: {resultado.get('mensagem')}"
                self._handle_error(error_msg)
                return Retorno.erro(error_msg)

            # Loga os dados de forma legível
            json_str = json.dumps(resultado, indent=4, use_decimal=True, ensure_ascii=False)
            self.log.debug(json_str)

            self._atualizar_view_com_dados(resultado.get("dados", {}))
            self.page.update()
            return Retorno.sucesso("Dados carregados com sucesso", resultado.get("dados"))

        except Exception as e:
            error_msg = f"Erro carregando dados: {e}"
            self._handle_error(error_msg)
            return Retorno.erro(error_msg)

    def _atualizar_view_com_dados(self, dados: dict) -> Dict[str, Any]:
        try:
            if not hasattr(self.receitas_view, 'rodaPe'):
                error_msg = "Componente rodaPe não inicializado!"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)

            # Atualiza paginação
            self.receitas_view.rodaPe.total_paginas = dados.get('total_paginas', 1)
            resultado = self.adicionar_receitas_view(dados)
            
            if not resultado.get("ok", False):
                return resultado
                
            self.receitas_view.rodaPe._atualizar_ui()
            return Retorno.sucesso("View atualizada com sucesso")

        except Exception as e:
            error_msg = f"Erro atualizando view: {e}"
            self._handle_error(error_msg)
            return Retorno.erro(error_msg)

    def adicionar_receitas_view(self, dados_response: dict) -> Dict[str, Any]:
        try:
            if not hasattr(self.receitas_view, 'columnbody'):
                raise ValueError("Container columnbody não existe na view")
            if not isinstance(self.receitas_view.columnbody, ft.Control):
                raise ValueError("columnbody não é um controle Flet válido")

            self.receitas_view.columnbody.controls.clear()
            receitas_lista = dados_response.get("itens") or []
            
            if not receitas_lista:
                return Retorno.sucesso("Nenhuma receita para exibir", dados_response)

            for receita in receitas_lista:
                bloco = self._bloco_component.criar_bloco(receita)
                self.receitas_view.columnbody.controls.append(bloco)

            if self.receitas_view.body in self.page.controls:
                self.receitas_view.body.update()

            return Retorno.sucesso(f"{len(receitas_lista)} receitas adicionadas à view")

        except Exception as e:
            error_msg = f"Erro ao adicionar receita: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _handle_busca_receita(self, termo: str) -> Dict[str, Any]:
        self.log.info(f"Busca de receitas iniciada com o termo: '{termo}'")
        try:
            self.receitas_view.limpar_receitas()
            resultado = self._receitas_Data_Handler.listar_receitas_paginadas(filtros={"termo": termo})

            if not resultado.get("ok", False):
                error_msg = resultado.get("mensagem", "Erro desconhecido na busca")
                self._handle_error(error_msg)
                return Retorno.erro(error_msg)

            if not resultado.get("dados", {}).get("itens"):
                self.receitas_view.error_message.value = "Nenhuma receita encontrada"
                self.log.warning(f"Nenhuma receita encontrada para o termo: '{termo}'")
                return Retorno.sucesso("Nenhuma receita encontrada", {"termo": termo})

            self.adicionar_receitas_view(resultado.get("dados"))
            self.page.update()
            return Retorno.sucesso(
                f"{len(resultado['dados']['itens'])} receitas encontradas",
                {"termo": termo, "quantidade": len(resultado['dados']['itens'])}
            )

        except Exception as e:
            error_msg = f"Erro ao buscar receitas com termo '{termo}': {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _handle_paginacao_receitas(self, pagina: int) -> Dict[str, Any]:
        self.log.info(f"Alterando para a página {pagina} de receitas")
        try:
            resultado = self._receitas_Data_Handler.listar_receitas_paginadas(pagina=pagina)
            
            if not resultado.get("ok", False):
                error_msg = f"Erro ao carregar página {pagina}: {resultado.get('mensagem')}"
                self._handle_error(error_msg)
                return Retorno.erro(error_msg)

            self.receitas_view.limpar_receitas()
            self.adicionar_receitas_view(resultado.get("dados"))
            self.page.update()
            
            return Retorno.sucesso(
                f"Página {pagina} carregada com {len(resultado['dados']['itens'])} receitas",
                {"pagina": pagina, "quantidade": len(resultado['dados']['itens'])}
            )
            
        except Exception as e:
            error_msg = f"Erro ao paginar receitas na página {pagina}: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _handle_nova_receita(self) -> Dict[str, Any]:
        """Abre o diálogo para criação de nova receita"""
        try:
            # 1. Obter lista de produtos
            resultado_produtos = ProdutoService.listar_para_dropdown()
            
            if not resultado_produtos.get("ok", False):
                error_msg = f"Falha ao obter produtos: {resultado_produtos.get('mensagem', 'Erro desconhecido')}"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)

            # 2. Extrair lista de produtos do retorno
            lista_produtos = resultado_produtos["dados"]
            self.log.debug(f"Produtos obtidos para dropdown: {lista_produtos}")

            # 3. Validar estrutura dos dados
            if not isinstance(lista_produtos, list):
                error_msg = "Estrutura de produtos inválida - lista esperada"
                self.log.error(f"{error_msg}. Tipo recebido: {type(lista_produtos)}")
                return Retorno.erro(error_msg)

            # 4. Criar e abrir diálogo
            dialog_receita = DialogReceita(self.page, lista_produtos, self.log)
            
            def on_salvar(dados):
                retorno = self._receitas_handler.adicionar_receita(dados)
                self._finalizar_operacao_receitas(retorno, dialog_receita)
            
            dialog_receita.abrir(modo_edicao=False, on_salvar=on_salvar)
            
            return Retorno.sucesso(
                "Diálogo de nova receita aberto com sucesso",
                {"quantidade_produtos": len(lista_produtos)}
            )
            
        except Exception as e:
            error_msg = f"Erro ao abrir diálogo de nova receita: {str(e)}"
            self.log.error(error_msg, exc_info=True)
            return Retorno.erro(error_msg)

    def _handle_editar_receita(self) -> Dict[str, Any]:
        """Abre o diálogo para edição da receita atualmente selecionada"""
        try:
            # 1. Obter a receita completa diretamente do handler
            resultado = self._receitas_handler.get_receita_completa_selecionada()
            
            if not resultado['ok']:
                return resultado 

            receita_completa = resultado['dados']
            
            # 2. Validar dados mínimos
            if not isinstance(receita_completa, dict) or not receita_completa.get('id'):
                error_msg = "Receita selecionada inválida ou sem ID"
                self.log.error(f"{error_msg}. Dados: {receita_completa}")
                return Retorno.dados_invalidos(error_msg)

            # 3. Obter apenas a lista de produtos (única chamada externa necessária)
            resultado_produtos = ProdutoService.listar_para_dropdown()
            
            if not resultado_produtos['ok']:
                return resultado_produtos  # Retorna o erro já formatado

            # 4. Preparar dados para o diálogo
            self.log.debug(f"Iniciando edição da receita ID: {receita_completa['id']}")

            # 5. Criar e abrir diálogo com os dados completos
            dialog_receita = DialogReceita(
                page=self.page,
                produtos=resultado_produtos['dados'],
                logger=self.log
            )
            
            def on_salvar(dados_editados):
                # O handler já sabe qual receita editar (mantém o estado)
                retorno = self._receitas_handler.editar_receita(dados_editados)
                self._finalizar_operacao_receitas(retorno, dialog_receita)
            
            dialog_receita.abrir(
                modo_edicao=True,
                dados_receita=receita_completa,
                on_salvar=on_salvar
            )
            
            return Retorno.sucesso(
                "Diálogo de edição aberto com sucesso",
                dados={
                    "receita_id": receita_completa['id'],
                    "nome_receita": receita_completa.get('nome_receita')
                }
            )
            
        except Exception as e:
            error_msg = f"Falha ao iniciar edição: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _handle_deletar_receita(self, e) -> Dict[str, Any]:
        self.log.info("Ação de exclusão de receita acionada")
        # Implementar exclusão
        return Retorno.sucesso("Exclusão de receita acionada (não implementado)")
    
    def _handle_error(self, error_msg: str) -> Dict[str, Any]:
        self.log.error(error_msg)
        self.receitas_view.error_message.value = error_msg
        self.page.update()
        return Retorno.erro(error_msg)

    def exibir_view_receitas(self) -> Dict[str, Any]:
        self.log.debug("Retornando view existente de receitas")
        try:
            if not hasattr(self.receitas_view, 'body'):
                raise ValueError("View de receitas não inicializada corretamente")
            return Retorno.sucesso("View de receitas retornada com sucesso", {"view": self.receitas_view.body})
        except Exception as e:
            error_msg = f"Erro ao exibir view de receitas: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _finalizar_operacao_receitas(self, resultado: Dict[str, Any], dialog=None) -> Dict[str, Any]:
        success = resultado.get("ok", False)
        message = resultado.get("mensagem", "Operação finalizada")
        
        self._show_snackbar(message, success)
        
        if success:
            if dialog:
                dialog.open = False
                self.page.update()

            self._receitas_Data_Handler.limpar_cache()
            time.sleep(0.3)
            return self.carregar_dados_receitas()
        
        return resultado

    def _show_snackbar(self, message: str, success: bool) -> Dict[str, Any]:
        try:
            self.page.snack_bar = ft.SnackBar(
                content=ft.Text(message),
                bgcolor=ft.Colors.GREEN_300 if success else ft.Colors.RED_300
            )
            self.page.snack_bar.open = True
            self.page.open(self.page.snack_bar)
            self.page.update()
            return Retorno.sucesso("Snackbar exibido com sucesso")
        except Exception as e:
            error_msg = f"Erro ao exibir snackbar: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)