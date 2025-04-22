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
    def __init__(self, page):
        super().__init__()

        self.acoes_estoque = AcoesEstoque(self)
        self.navbar = NavebarSuperiorEstoque(acoes=self.acoes_estoque)
        self.tabela = ListagemProdutos()
        self.page = page

        self.controls = [
            self.navbar,
            ft.Divider(),
            self.tabela
        ]

    def adicionar_produto(self, e):
        logger.info("🔧 Abrir tela de cadastro de produto")
        self.cadastro_produto = CadastroProduto(on_save=self.atualizar_tabela)
        self.cadastro_produto.open = True
        if self.cadastro_produto not in self.page.overlay:
            self.page.overlay.append(self.cadastro_produto)
        self.page.update()
    
    def buscar_produto(self, e):
        termo = self.navbar.campo_busca.value.strip().lower()
        logger.info(f"🔍 Buscando produto com termo: {termo}")
        if termo == "":
            logger.warning("Campo de busca vazio. Carregando todos os produtos.")
            self.tabela.carregar_produtos()
        else:
            logger.info(f"🔍 Buscando produtos com o termo: {termo}")
            produtos = produto_controller.ProdutoController.buscar_produto(termo)
            if produtos:
                self.tabela.carregar_produtos(produtos)
            else:
                logger.warning("Nenhum produto encontrado com o termo fornecido.")
                self.tabela.carregar_produtos([])
                
    def editar_produto(self, e):
        logger.info("🔧 Abrindo tela de edição de produto")
        if self.tabela._produto_activo:
            produto = self.tabela._produto_activo
            self.cadastro_produto = CadastroProduto(produto=produto, on_save=self.atualizar_tabela)
            self.cadastro_produto.open = True
            if self.cadastro_produto not in self.page.overlay:
                self.page.overlay.append(self.cadastro_produto)
            self.page.update()
        else:
            logger.warning("Nenhum produto selecionado para edição.")
    def remover_produto(self, e):
        logger.info("🔧 Removendo produto")
        if self.tabela._produto_activo:
            produto = self.tabela._produto_activo
            logger.info(f"Produto selecionado: {produto}")
            produto_controller.ProdutoController.remover_produto(produto.id)
            self.tabela.carregar_produtos()
            logger.info("✅ Produto removido com sucesso!")
        else:
            logger.warning("Nenhum produto selecionado para remoção.")
    def atualizar_tabela(self):
        logger.info("🔧 Atualizando tabela de produtos")
        logger.info("✅ Produto cadastrado com sucesso!")
        self.tabela.atualizar_tabela()
        self.cadastro_produto.open = False
        self.update()
        self.page.update()
        logger.info("🔧 Tela de cadastro fechada")
        
