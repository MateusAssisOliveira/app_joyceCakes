import flet as ft
import logging
from controllers import produto_controller
from controllers.estoque_controller import AcoesEstoque
from views.nave_bar_estoque import NavebarSuperiorEstoque
from views.listagem_produtos import ListagemProdutos
from views.cadastro_produto import CadastroProduto

# Configuração do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Estoque(ft.Column):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.acoes_estoque = AcoesEstoque(self)
        self.navbar = NavebarSuperiorEstoque(acoes=self.acoes_estoque)
        self.tabela = ListagemProdutos(self.page)

        self.controls = [
            self.navbar,
            ft.Divider(),
            self.tabela.content
        ]

    def adicionar_produto(self, e: ft.ControlEvent) -> None:
        """Abre o diálogo de cadastro de novo produto."""
        logger.info("Abrindo tela de cadastro de produto")
        try:
            self.cadastro_produto = CadastroProduto(on_save=self.atualizar_tabela)
            self._abrir_dialogo(self.cadastro_produto)
        except Exception as e:
            logger.error(f"Erro ao abrir cadastro de produto: {e}")
            self._mostrar_mensagem_erro("Erro ao abrir formulário")

    def buscar_produto(self, e: ft.ControlEvent) -> None:
        """Busca produtos conforme o termo informado."""
        termo = self.navbar.campo_busca.value.strip().lower()
        logger.info(f"Buscando produto com termo: {termo}")
        
        try:
            if not termo:
                logger.info("Carregando todos os produtos")
                self.tabela.carregar_produtos()
            else:
                produtos = produto_controller.ProdutoController.buscar_produto(termo)
                if produtos:
                    self.tabela.carregar_produtos(produtos)
                else:
                    logger.info("Nenhum produto encontrado")
                    self.tabela.mostrar_mensagem_na_tabela("Nenhum produto encontrado")
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            self._mostrar_mensagem_erro("Erro na busca de produtos")

    def editar_produto(self, e: ft.ControlEvent) -> None:
        """Abre o diálogo para edição do produto selecionado."""
        logger.info("Abrindo edição de produto")
        try:
            if not self.tabela.obter_produto_selecionado():
                logger.warning("Nenhum produto selecionado")
                self._mostrar_mensagem_erro("Selecione um produto para editar")
                return

            produto = self._obter_produto_selecionado()
            if produto:
                self.cadastro_produto = CadastroProduto(
                    produto=produto,
                    on_save=self.atualizar_tabela
                )
                self._abrir_dialogo(self.cadastro_produto)
        except Exception as e:
            logger.error(f"Erro ao editar produto: {e}")
            self._mostrar_mensagem_erro("Erro ao abrir edição")

    def remover_produto(self, e: ft.ControlEvent) -> None:
        """Remove o produto selecionado."""
        logger.info("Iniciando remoção de produto")
        try:
            produto_id = self.tabela.obter_produto_selecionado()
            if not produto_id:
                logger.warning("Nenhum produto selecionado")
                self._mostrar_mensagem_erro("Selecione um produto para remover")
                return

            produto_controller.ProdutoController.remover_produto(produto_id)
            self.tabela.carregar_produtos()
            logger.info("Produto removido com sucesso")
            self._mostrar_mensagem_sucesso("Produto removido!")
        except Exception as e:
            logger.error(f"Erro ao remover produto: {e}")
            self._mostrar_mensagem_erro("Erro ao remover produto")

    def atualizar_tabela(self) -> None:
        """Atualiza a tabela de produtos e fecha o diálogo."""
        logger.info("Atualizando tabela de produtos")
        try:
            self.tabela.atualizar_tabela()
            if hasattr(self, 'cadastro_produto'):
                self.cadastro_produto.open = False
            self.page.update()
        except Exception as e:
            logger.error(f"Erro ao atualizar tabela: {e}")

    # Métodos auxiliares
    def _abrir_dialogo(self, dialogo: ft.Control) -> None:
        """Abre um diálogo na página."""
        dialogo.open = True
        if dialogo not in self.page.overlay:
            self.page.overlay.append(dialogo)
        self.page.update()

    def _obter_produto_selecionado(self):
        """Obtém o produto selecionado na tabela."""
        produto_id = self.tabela.obter_produto_selecionado()
        if produto_id:
            return produto_controller.ProdutoController.obter_produto_por_id(produto_id)
        return None

    def _mostrar_mensagem_erro(self, mensagem: str) -> None:
        """Exibe uma mensagem de erro."""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=ft.colors.RED
        )
        self.page.snack_bar.open = True
        self.page.update()

    def _mostrar_mensagem_sucesso(self, mensagem: str) -> None:
        """Exibe uma mensagem de sucesso."""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=ft.colors.GREEN
        )
        self.page.snack_bar.open = True
        self.page.update()