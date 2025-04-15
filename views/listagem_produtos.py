import flet as ft
from controllers.produto_controller import ProdutoController
from functools import partial

class ListagemProdutos(ft.Column):
    def __init__(self):
        super().__init__()
        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID")),
                ft.DataColumn(ft.Text("Nome")),
                ft.DataColumn(ft.Text("Descrição")),
                ft.DataColumn(ft.Text("Preço")),
                ft.DataColumn(ft.Text("Quantidade")),
                ft.DataColumn(ft.Text("Tipo")),
                ft.DataColumn(ft.Text("Ações")),
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
        print("🔄 Carregando produtos...")
        self.tabela.rows.clear()
        try:
            produtos = ProdutoController.listar_produtos()
            print(f"Produtos carregados: {produtos}")
            if not produtos:
                self.tabela.rows.append(
                    ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado."))])
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
                                ft.DataCell(
                                    ft.Row([
                                        ft.IconButton(ft.icons.EDIT, on_click=partial(self.editar_produto, produto.id)),
                                        ft.IconButton(ft.icons.DELETE, on_click=partial(self.excluir_produto, produto.id)),
                                    ])
                                ),
                            ]
                        )
                    )
        except Exception as e:
            print(f"Erro ao carregar produtos: {e}")

    def editar_produto(self, e):
        print("Editar produto")

    def excluir_produto(self, e):
        print("Excluir produto")
    def atualizar_tabela(self):
        print("🔄 Atualizando tabela de produtos")
        self.carregar_produtos()
        self.update()
