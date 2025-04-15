import flet as ft
import logging
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
    def __init__(self, page):
        super().__init__()

        self.navbar = NavebarSuperiorEstoque(on_add_produto=self.abrir_cadastro)
        self.tabela = ListagemProdutos()
        self.page = page

        self.controls = [
            self.navbar,
            ft.Divider(),
            self.tabela
        ]

    def abrir_cadastro(self, e):
        logger.info("🔧 Abrir tela de cadastro de produto")
        self.cadastro_produto = CadastroProduto(on_save=self.atualizar_tabela)
        self.cadastro_produto.open = True
        if self.cadastro_produto not in self.page.overlay:
            self.page.overlay.append(self.cadastro_produto)

        self.page.update()

    def atualizar_tabela(self):
        logger.info("🔧 Atualizando tabela de produtos")
        logger.info("✅ Produto cadastrado com sucesso!")
        self.tabela.atualizar_tabela()
        self.cadastro_produto.open = False
        self.update()
        self.page.update()
        logger.info("🔧 Tela de cadastro fechada")
        
