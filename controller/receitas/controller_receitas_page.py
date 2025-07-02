import time
import simplejson as json

from components.receita_bloco import ReceitaBloco
from controller.receitas.controller_receitas_data_handler import ReceitasDataHandler
from controller.receitas.controller_receitas_handler import ReceitastHandler
from logs.logger import Logger
import flet as ft

from model.receitas.receitas_model import ReceitasModel
from services.produto.produto_service import ProdutoService
from ui.dialogs.receitas.receita_dialog import DialogReceita
from view.receitas.receitas_page_view import ReceitasPageView

class ReceitasPageController:
    def __init__(self, page: ft.Page, receitas_model: ReceitasModel, receitas_view: ReceitasPageView):
        self.page = page
        
        self.receitas_view = receitas_view
        self._bloco_component = ReceitaBloco()  # Componente de blocos
        self.receitas_model = receitas_model
        self.log = Logger()
        self.log.info("Inicializando ReceitasPageController")
        self._setup_callbacks()
        self._initialize_handlers()

    def _initialize_handlers(self):
        """Inicializa os handlers de dados e produtos"""
        try:
            self._receitas_Data_Handler = ReceitasDataHandler(self.receitas_model,self.log)
            self._receitas_handler = ReceitastHandler(self.receitas_model, self.log)
            self.log.info("Handlers inicializados com sucesso")
        except Exception as e:
            self._handle_error(f"Falha na inicialização: {e}")

    def _setup_callbacks(self):
        """Configura todos os callbacks"""
        self.log.debug("Configurando callbacks da view")
        self.receitas_view.set_on_buscar(self._handle_busca_receita)
        self.receitas_view.definir_acoes_botoes_navBar({
            'home': lambda: self.page.go('/'),
            'novo': self._handle_nova_receita,
            'editar': self._handle_editar_receita,
            'deletar': self._handle_deletar_receita
        })
        self.receitas_view.definir_acoes_botoes_rodape(self._handle_paginacao_receitas)
    
    def carregar_dados_receitas(self, pagina: int = 1):
        """Carrega os dados do estoque para uma página específica"""
        try:
            resultado = self._receitas_Data_Handler.listar_receitas_paginadas(pagina=pagina)
            json_str = json.dumps(resultado, indent=4, use_decimal=True, ensure_ascii=False)
            self.log.debug(json_str)
            
            self._atualizar_view_com_dados(resultado)
            self.page.update()

        except Exception as e:
            self._handle_error(f"Erro carregando dados: {e}")

    def _atualizar_view_com_dados(self, resultado: dict):
        """Atualiza a view com os dados recebidos"""
        try:
            self.receitas_view.rodaPe.total_paginas = resultado.get('total_paginas')
            self.adicionar_receitas_view(resultado)
            self.receitas_view.rodaPe._atualizar_ui()
        except Exception as e:
            self._handle_error(f"Erro atualizando view: {e}")

    def set_on_clique_bloco(self, callback: callable):
        """Configura callback para clique nos blocos"""
        self._bloco_component._handle_clique_bloco = callback
        self.log.debug("Callback de clique em bloco configurado")

    def adicionar_receitas_view(self, receitas_response: dict):
        """Adiciona blocos de receita ao body a partir do dicionário completo da resposta"""
        try:
            self.log.debug(f"Adicionando receitas: {receitas_response}")

            receitas_lista = receitas_response.get('dados', [])
            for receita in receitas_lista:
                bloco = self._bloco_component.criar_bloco(receita)
                self.receitas_view.columnbody.controls.append(bloco)

            self.receitas_view.body.update()

        except Exception as e:
            self.log.error(f"Erro ao adicionar receita: {str(e)}")

    def _handle_busca_receita(self, termo: str):
        """Lida com a busca de receitas"""
        self.log.info(f"Busca de receitas iniciada com o termo: '{termo}'")
        try:
            self.receitas_view.limpar_receitas()
            dados = self._receitas_Data_Handler.listar_receitas_paginadas(filtro=termo)

            if not dados['dados']:
                self.receitas_view.error_message.value = "Nenhuma receita encontrada"
                self.log.warning(f"Nenhuma receita encontrada para o termo: '{termo}'")
            else:
                for receita in dados['dados']:
                    self.adicionar_receitas_view(receita)
                self.log.info(f"{len(dados['dados'])} receitas encontradas para o termo '{termo}'")

            self.page.update()
        except Exception as e:
            self.log.error(f"Erro ao buscar receitas com termo '{termo}': {str(e)}")

    def _handle_paginacao_receitas(self, pagina: int):
        """Lida com a mudança de página"""
        self.log.info(f"Alterando para a página {pagina} de receitas")
        try:
            dados = self._receitas_Data_Handler.listar_receitas_paginadas(pagina=pagina)
            self.receitas_view.limpar_receitas()

            for receita in dados['dados']:
                self.adicionar_receitas_view(receita)

            self.page.update()
            self.log.info(f"Página {pagina} carregada com {len(dados['dados'])} receitas")
        except Exception as e:
            self.log.error(f"Erro ao paginar receitas na página {pagina}: {str(e)}")

    def _handle_nova_receita(self):
        """Abre diálogo para nova receita"""
        """Abre diálogo para adicionar novo produto"""
        lista_produtos = ProdutoService.listar_para_dropdown()
        self.log.debug(f"\n\nTODOS OS PRODUTOS DO DB{lista_produtos}\n\n")

        dialog_receita = DialogReceita(self.page, lista_produtos,self.log)
        
        def on_salvar(dados):
            success, message = self._receitas_handler.adicionar_receita(dados)
            self._finalizar_operacao_receitas(success, message, dialog_receita)
            
        dialog_receita.abrir(
            modo_edicao=False,
            on_salvar=on_salvar,
        )

    def _handle_editar_receita(self, e):
        """Abre diálogo para edição"""
        self.log.info("Ação de edição de receita acionada")
        # Implementar edição
        pass

    def _handle_deletar_receita(self, e):
        """Lida com exclusão"""
        self.log.info("Ação de exclusão de receita acionada")
        # Implementar exclusão
        pass
    
    def _handle_error(self, error_msg: str):
        """Tratamento centralizado de erros"""
        self.log.error(error_msg)
        self.receitas_view.error_message.value = error_msg
        self.page.update()

    def exibir_view_receitas(self):
        """Retorna a view inicial"""
        self.log.debug("Exibindo view inicial de receitas")
        self.carregar_dados_receitas()
        return self.receitas_view.create_view()
    
    def _finalizar_operacao_receitas(self, success: bool, message: str, dialog=None):
        """Finaliza operações comuns após adição/edição/exclusão"""
        self._show_snackbar(message, success)
        if success:
            if dialog:
                dialog.open = False
                self.page.update()

            self._receitas_Data_Handler.limpar_cache_paginacao()
            time.sleep(0.3)  # Pequeno delay para visualização
            self.carregar_dados_receitas()
            
    def _show_snackbar(self, message: str, success: bool):
        """Exibe mensagem de feedback"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(message),
            bgcolor=ft.Colors.GREEN_300 if success else ft.Colors.RED_300
        )
        self.page.snack_bar.open = True
        self.page.open(self.page.snack_bar)
        self.page.update()