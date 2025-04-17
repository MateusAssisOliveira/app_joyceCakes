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
                ft.DataColumn(ft.Text("Tipo"))
                ],
            rows=[]
        )

        # Carregar produtos e montar a UI
        self.carregar_produtos()

        self.controls = [
            ft.Text("Lista de Produtos", size=20, weight="bold"),
            self.tabela
        ]

    def carregar_produtos(self):
        logger.info("🔄 Carregando produtos...")  # Log de início de carregamento
        self.tabela.rows.clear()
        try:
            produtos = ProdutoController.listar_produtos()
            logger.info(f"Produtos carregados em carregar_produtos : {len(produtos)} produtos encontrados.")  # Log com o número de produtos encontrados


            if produtos:
                logger.info(f"Produtos carregados: {len(produtos)} produtos encontrados.")  # Log com o número de produtos encontrados
            else:
                logger.warning("Nenhum produto encontrado.")  # Log caso não haja produtos
                self.tabela.rows.append(
                    ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado."))])
                )
                return
            
            for produto in produtos:
                selecionado = self._produto_activo == produto.id
                logger.debug(f"Adicionando produto {produto.id}: {produto.nome}")  # Log de cada produto adicionado
                self.tabela.rows.append(
                    ft.DataRow(
                        
                        cells=[
                            ft.DataCell(ft.Text(str(produto.id))),
                            ft.DataCell(ft.Text(produto.nome)),
                            ft.DataCell(ft.Text(produto.descricao)),
                            ft.DataCell(ft.Text(f"R$ {produto.preco:.2f}")),
                            ft.DataCell(ft.Text(str(produto.quantidade))),
                            ft.DataCell(ft.Text(produto.tipo))
                            ],
                        on_select_changed=partial(self.selecionar_produto, produto),
                        selected=selecionado,
                        bgcolor=ft.colors.BLUE_100 if selecionado else None,

                    )
                )
        except Exception as e:
            logger.error(f"Erro ao carregar produtos: {e}")  # Log de erro se houver uma exceção

    def editar_produto(self, e):
        logger.info(f"Solicitação de edição para o produto {e}")  # Log quando um produto é solicitado para edição
        print("Editar produto")

    def excluir_produto(self, e):
        logger.info(f"Solicitação de exclusão para o produto {e}")  # Log quando um produto é solicitado para exclusão
        print("Excluir produto")

    def atualizar_tabela(self):
        logger.info("🔄 Atualizando tabela de produtos...")  # Log antes de atualizar a tabela
        self.carregar_produtos()
        self.update()

    def selecionar_produto(self, produto, is_selected=None, event=None):
        logger.info(f"Produto Selecionado{produto}")
        self._produto_activo = produto