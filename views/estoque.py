import flet as ft
import logging
from controllers import produto_controller
from views.nave_bar_estoque import NavebarSuperiorEstoque
from views.listagem_produtos import ListagemProdutos
from views.cadastro_produto import CadastroProduto
from config.logger_config import ConfigurarLogger

class Estoque(ft.Column):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.logger = ConfigurarLogger.configurar("Estoque", log_em_arquivo=True)
        
        self.navbar = NavebarSuperiorEstoque(
            on_adicionar=self.adicionar_produto,
            on_buscar=self.buscar_produto,
            on_editar=self.editar_produto,
            on_remover=self.remover_produto
        )
        self.tabela = ListagemProdutos(self.page)

        self.controls = [
            self.navbar,
            ft.Divider(),
            self.tabela.content
        ]
        
        self.logger.info("Componente Estoque inicializado com sucesso")

    def adicionar_produto(self, e: ft.ControlEvent = None) -> None:
        """Abre o diálogo de cadastro de novo produto."""
        try:
            self.logger.info("Iniciando processo de adição de novo produto")
            self.cadastro_produto = CadastroProduto(on_save=self.atualizar_tabela)
            self._abrir_dialogo(self.cadastro_produto)
            self.logger.info("Diálogo de cadastro de produto aberto com sucesso")
        except Exception as e:
            error_msg = f"Erro ao abrir cadastro: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def buscar_produto(self, termo: str | ft.ControlEvent) -> None:
        """Busca produtos conforme o termo informado."""
        try:
            termo = termo.value if isinstance(termo, ft.ControlEvent) else termo
            termo = str(termo).strip().lower()
            self.logger.info(f"Iniciando busca por produtos com termo: '{termo}'")

            if not termo:
                self.logger.debug("Termo de busca vazio - carregando todos os produtos")
                self.tabela.carregar_produtos()
            else:
                produtos = produto_controller.ProdutoController.buscar_produto(termo)
                #self.logger.debug(f"Busca retornou {len(produtos) if produtos else 0} resultados")
                
                self.tabela.carregar_produtos(produtos if produtos else None)

        except Exception as e:
            error_msg = f"Erro na busca: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def editar_produto(self, e: ft.ControlEvent = None) -> None:
        """Abre a edição do produto selecionado."""
        try:
            self.logger.info("Iniciando processo de edição de produto")
            
            if not (produto_id := self.tabela.obter_produto_selecionado()):
                warn_msg = "Nenhum produto selecionado para edição"
                self.logger.warning(warn_msg)
                self._mostrar_mensagem(warn_msg, "aviso")
                return

            self.logger.debug(f"Produto selecionado para edição - ID: {produto_id}")
            produto = produto_controller.ProdutoController.obter_produto_por_id(produto_id)
            
            self.cadastro_produto = CadastroProduto(
                produto=produto,
                on_save=self.atualizar_tabela
            )
            self._abrir_dialogo(self.cadastro_produto)
            self.logger.info(f"Diálogo de edição aberto para produto ID: {produto_id}")

        except Exception as e:
            error_msg = f"Erro ao editar produto: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def remover_produto(self, e: ft.ControlEvent = None) -> None:
        """Remove o produto selecionado."""
        try:
            self.logger.info("Iniciando processo de remoção de produto")
            
            if not (produto_id := self.tabela.obter_produto_selecionado()):
                warn_msg = "Nenhum produto selecionado para remoção"
                self.logger.warning(warn_msg)
                self._mostrar_mensagem(warn_msg, "aviso")
                return

            self.logger.debug(f"Confirmando remoção do produto ID: {produto_id}")
            produto_controller.ProdutoController.deletar_produto(produto_id)
            
            self.tabela.carregar_produtos()
            success_msg = f"Produto ID {produto_id} removido com sucesso!"
            self.logger.info(success_msg)
            self._mostrar_mensagem(success_msg, "sucesso")

        except Exception as e:
            error_msg = f"Erro ao remover produto: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def atualizar_tabela(self) -> None:
        """Atualiza a tabela de produtos."""
        try:
            self.logger.debug("Atualizando tabela de produtos")
            self.tabela.carregar_produtos()
            self.page.update()
            self.logger.debug("Tabela de produtos atualizada com sucesso")
        except Exception as e:
            error_msg = f"Erro ao atualizar tabela: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def _abrir_dialogo(self, dialogo: ft.Control) -> None:
        """Abre um diálogo na página."""
        try:
            self.logger.debug(f"Abrindo diálogo: {dialogo.__class__.__name__}")
            dialogo.open = True
            if dialogo not in self.page.overlay:
                self.page.overlay.append(dialogo)
            self.page.update()
            self.logger.debug("Diálogo aberto com sucesso")
        except Exception as e:
            error_msg = f"Erro ao abrir diálogo: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self._mostrar_mensagem(error_msg, "erro")

    def _mostrar_mensagem(self, mensagem: str, tipo: str = "erro") -> None:
        """Exibe uma mensagem na interface."""
        try:
            self.logger.debug(f"Exibindo mensagem do tipo '{tipo}': {mensagem}")
            cores = {
                "erro": ft.colors.RED,
                "sucesso": ft.colors.GREEN,
                "aviso": ft.colors.AMBER
            }
            self.page.snack_bar = ft.SnackBar(
                content=ft.Text(mensagem),
                bgcolor=cores.get(tipo, ft.colors.RED)
            )
            self.page.snack_bar.open = True
            self.page.update()
        except Exception as e:
            self.logger.error(f"Erro ao exibir mensagem: {str(e)}", exc_info=True)