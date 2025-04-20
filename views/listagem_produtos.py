import flet as ft
import logging
from controllers.produto_controller import ProdutoController
from functools import partial

# Configuração básica do logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ListagemProdutos(ft.Column):
    def __init__(self):
        self._produto_activo = None
        super().__init__()

        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID")),
                ft.DataColumn(ft.Text("Nome")),
                ft.DataColumn(ft.Text("Descrição")),
                ft.DataColumn(ft.Text("Preço")),
                ft.DataColumn(ft.Text("Quantidade")),
                ft.DataColumn(ft.Text("Tipo")),
            ],
            rows=[]
        )

        # Carregar produtos e montar a UI
        self.carregar_produtos()

        self.controls = [
            ft.Text("Lista de Produtos", size=20, weight="bold"),
            self.tabela
        ]

    def celula(self, texto, selecionado=False, alinhamento=ft.alignment.center_left):
        """Cria uma célula estilizada, destacando se estiver selecionada."""
        return ft.DataCell(
            ft.Container(
                content=ft.Text(
                    str(texto),
                    weight="bold" if selecionado else "normal",
                    color=ft.colors.BLUE_900 if selecionado else ft.colors.BLACK,
                    size=12
                ),
                padding=ft.padding.symmetric(horizontal=6, vertical=4),
                alignment=alinhamento,
                height=36,
            )
        )

    def carregar_produtos(self, produtos=None):
        logger.info("🔄 Carregando produtos...")
        logger.debug("Limpando tabela antes de carregar novos produtos.")
        self.tabela.rows.clear()
        
        if produtos is None:
            try:
                produtos = ProdutoController.listar_produtos()
                if not produtos:
                    logger.warning("Nenhum produto encontrado.")
                    self.tabela.rows.append(
                        ft.DataRow(cells=[self.celula("Nenhum produto encontrado.")])
                    )
                    return

                for produto in produtos:
                    selecionado = self._produto_activo == produto.id
                    logger.debug(f"Adicionando produto {produto.id}: {produto.nome}")

                    self.tabela.rows.append(
                        ft.DataRow(
                            cells=[
                                self.celula(produto.id, selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.nome, selecionado),
                                self.celula(produto.descricao, selecionado),
                                self.celula(f"R$ {produto.preco:.2f}", selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.quantidade, selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.tipo, selecionado, alinhamento=ft.alignment.center),
                            ],
                            on_select_changed=partial(self.selecionar_produto, produto),
                            selected=selecionado,
                        )
                    )
            except Exception as e:
                logger.error(f"Erro ao carregar produtos: {e}")
        else:
            try:    
                for produto in produtos:
                    selecionado = self._produto_activo == produto.id
                    logger.debug(f"Adicionando produto {produto.id}: {produto.nome}")

                    self.tabela.rows.append(
                        ft.DataRow(
                            cells=[
                                self.celula(produto.id, selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.nome, selecionado),
                                self.celula(produto.descricao, selecionado),
                                self.celula(f"R$ {produto.preco:.2f}", selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.quantidade, selecionado, alinhamento=ft.alignment.center),
                                self.celula(produto.tipo, selecionado, alinhamento=ft.alignment.center),
                            ],
                            on_select_changed=partial(self.selecionar_produto, produto),
                            selected=selecionado,
                        )
                    )
            except Exception as e:
                logger.error(f"Erro ao carregar produtos: {e}")
                self.tabela.rows.append(
                    ft.DataRow(cells=[self.celula("Nenhum produto encontrado.")])
                )


    def atualizar_tabela(self,produtos=None):
        logger.info("🔄 Atualizando tabela de produtos...")
        self.carregar_produtos(produtos)
        self.update()

    def selecionar_produto(self, produto, is_selected=None, event=None):
        logger.info(f"Produto Selecionado: {produto}")
        self._produto_activo = produto.id
        self.atualizar_tabela()

    def editar_produto(self, e):
        logger.info(f"Solicitação de edição para o produto {e}")
        print("Editar produto")

    def excluir_produto(self, e):
        logger.info(f"Solicitação de exclusão para o produto {e}")
        print("Excluir produto")
