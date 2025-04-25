import logging
from controllers import produto_controller
from config.logger_config import ConfigurarLogger
import flet as ft

class EstoqueController:
    def __init__(self, view):
        self.view = view
        self.logger = ConfigurarLogger.configurar("EstoqueController", log_em_arquivo=True)
        
    def adicionar_produto(self, e=None):
        """Lógica para adicionar novo produto"""
        try:
            self.logger.info("Iniciando processo de adição de novo produto")
            cadastro_produto = self.view.cadastro_produto_class(
                on_save=self.atualizar_tabela
            )
            self.view.abrir_dialogo(cadastro_produto)
        except Exception as e:
            error_msg = f"Erro ao abrir cadastro: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.view.mostrar_mensagem(error_msg, "erro")

    def buscar_produto(self, termo):
        """Busca produtos conforme o termo informado"""
        try:
            termo = termo.value if isinstance(termo, ft.ControlEvent) else termo
            termo = str(termo).strip().lower()
            self.logger.info(f"Iniciando busca por produtos com termo: '{termo}'")

            if not termo:
                self.logger.debug("Termo de busca vazio - carregando todos os produtos com paginação")
                self.view.tabela.pagina_atual = 1
                self.view.tabela.carregar_produtos()
            else:
                produtos = produto_controller.ProdutoController.buscar_produto(termo)
                self.view.tabela.carregar_produtos(produtos if produtos else None)

        except Exception as e:
            error_msg = f"Erro na busca: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.view.mostrar_mensagem(error_msg, "erro")

    def editar_produto(self, e=None):
        """Lógica para editar um produto existente"""
        try:
            self.logger.info("Iniciando processo de edição de produto")
            
            if not (produto_id := self.view.tabela.obter_produto_selecionado()):
                warn_msg = "Nenhum produto selecionado para edição"
                self.logger.warning(warn_msg)
                self.view.mostrar_mensagem(warn_msg, "aviso")
                return

            self.logger.debug(f"Produto selecionado para edição - ID: {produto_id}")
            produto = produto_controller.ProdutoController.obter_produto_por_id(produto_id)
            
            cadastro_produto = self.view.cadastro_produto_class(
                produto=produto,
                on_save=self.atualizar_tabela
            )
            self.view.abrir_dialogo(cadastro_produto)
            self.logger.info(f"Diálogo de edição aberto para produto ID: {produto_id}")

        except Exception as e:
            error_msg = f"Erro ao editar produto: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.view.mostrar_mensagem(error_msg, "erro")

    def remover_produto(self, e=None):
        """Lógica para remover um produto"""
        try:
            self.logger.info("Iniciando processo de remoção de produto")
            
            if not (produto_id := self.view.tabela.obter_produto_selecionado()):
                warn_msg = "Nenhum produto selecionado para remoção"
                self.logger.warning(warn_msg)
                self.view.mostrar_mensagem(warn_msg, "aviso")
                return

            self.logger.debug(f"Confirmando remoção do produto ID: {produto_id}")
            produto_controller.ProdutoController.deletar_produto(produto_id)
            
            self.view.tabela.carregar_produtos()
            success_msg = f"Produto ID {produto_id} removido com sucesso!"
            self.logger.info(success_msg)
            self.view.mostrar_mensagem(success_msg, "sucesso")

        except Exception as e:
            error_msg = f"Erro ao remover produto: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.view.mostrar_mensagem(error_msg, "erro")

    def atualizar_tabela(self):
        """Atualiza a tabela de produtos"""
        try:
            self.logger.debug("Atualizando tabela de produtos")
            self.view.tabela.pagina_atual = 1
            self.view.tabela.carregar_produtos()
            self.view.page.update()
            self.logger.debug("Tabela de produtos atualizada com sucesso")
        except Exception as e:
            error_msg = f"Erro ao atualizar tabela: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.view.mostrar_mensagem(error_msg, "erro")