import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

class ListagemProdutos:
    def __init__(self, page: ft.Page):
        self.page = page
        self._produto_selecionado = None
        
        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID", weight="bold")),
                ft.DataColumn(ft.Text("Nome", weight="bold")),
                ft.DataColumn(ft.Text("Descrição", weight="bold")),
                ft.DataColumn(ft.Text("Preço", weight="bold")),
                ft.DataColumn(ft.Text("Quantidade", weight="bold")),
                ft.DataColumn(ft.Text("Tipo", weight="bold")),
            ],
            rows=[],
            heading_row_height=40,
        )

        self.content = ft.Container(
            content=ft.Column([
                ft.Text("Lista de Produtos", size=20, weight="bold"),
                ft.Container(
                    content=self.tabela,
                    padding=10,
                    border=ft.border.all(1, ft.colors.OUTLINE),
                    border_radius=8,
                )
            ], expand=True),
            expand=True
        )
        self.carregar_produtos()

    def carregar_produtos(self, produtos: list[Produto] = None) -> None:
        """Carrega produtos na tabela."""
        produtos = produtos or ProdutoController.listar_produtos()
        self.tabela.rows = []
        
        if not produtos:
            self.tabela.rows.append(
                ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado"))])
            )
            return

        for produto in produtos:
            self.tabela.rows.append(
                ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(str(produto.id))),
                        ft.DataCell(ft.Text(produto.nome)),
                        ft.DataCell(ft.Text(produto.descricao)),
                        ft.DataCell(ft.Text(f"R$ {produto.preco:.2f}")),
                        ft.DataCell(ft.Text(str(produto.quantidade))),
                        ft.DataCell(ft.Text(produto.tipo)),
                    ],
                    on_select_changed=lambda e, p=produto: self._selecionar_produto(p)
                )
            )
        self.page.update()

    def _selecionar_produto(self, produto: Produto) -> None:
        """Gerencia a seleção de produtos."""
        self._produto_selecionado = produto.id
        # Atualiza a UI para mostrar seleção
        for row in self.tabela.rows:
            row.selected = (row.cells[0].content.value == str(produto.id))
        self.page.update()

    def obter_produto_selecionado(self) -> int | None:
        """Retorna o ID do produto selecionado."""
        return self._produto_selecionado