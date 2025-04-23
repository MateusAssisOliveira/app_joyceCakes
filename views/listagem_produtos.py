import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

class ListagemProdutos:
    def __init__(self, page: ft.Page):
        self.page = page
        self._produto_selecionado = None

        self.coluna_ordenacao = "id"
        self.ordem_crescente = True

        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID"), on_sort=lambda e: self.ordenar_por("id")),
                ft.DataColumn(ft.Text("Nome"), on_sort=lambda e: self.ordenar_por("nome")),
                ft.DataColumn(ft.Text("Descrição")),
                ft.DataColumn(ft.Text("Preço"), on_sort=lambda e: self.ordenar_por("preco")),
                ft.DataColumn(ft.Text("Quantidade"), on_sort=lambda e: self.ordenar_por("quantidade")),
                ft.DataColumn(ft.Text("Tipo"), on_sort=lambda e: self.ordenar_por("tipo")),
            ],
            rows=[],
            sort_column_index=0,
            sort_ascending=True,
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
        produtos = produtos or ProdutoController.listar_produtos()

        # Ordenação com base na coluna e direção
        if produtos:
            produtos.sort(
                key=lambda p: getattr(p, self.coluna_ordenacao),
                reverse=not self.ordem_crescente
            )

        self.tabela.rows = []

        if not produtos:
            self.tabela.rows.append(
                ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado"))])
            )
        else:
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

    def ordenar_por(self, coluna):
        if self.coluna_ordenacao == coluna:
            self.ordem_crescente = not self.ordem_crescente
        else:
            self.coluna_ordenacao = coluna
            self.ordem_crescente = True

        # Atualiza o índice de ordenação visual da tabela
        colunas = ["id", "nome", "", "preco", "quantidade", "tipo"]
        if coluna in colunas:
            self.tabela.sort_column_index = colunas.index(coluna)
            self.tabela.sort_ascending = self.ordem_crescente

        self.carregar_produtos()

    def _selecionar_produto(self, produto: Produto) -> None:
        self._produto_selecionado = produto.id
        for row in self.tabela.rows:
            row.selected = (row.cells[0].content.value == str(produto.id))
        self.page.update()

    def obter_produto_selecionado(self) -> int | None:
        return self._produto_selecionado
