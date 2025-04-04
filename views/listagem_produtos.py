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
        
    def carregar_produtos(self):
        """Busca os produtos no banco e exibe na tabela."""
        self.tabela.rows.clear()  # Limpa a tabela antes de carregar os dados
        try:
            produtos = ProdutoController.listar_produtos()
            
            print(f"Produtos carregados: {produtos}")
            if not produtos:
                self.tabela.rows.append(ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado."))]))
            else:
                            
                for produto in produtos:
                    id_ = produto.id
                    nome = produto.nome
                    descricao = produto.descricao
                    preco = produto.preco
                    quantidade = produto.quantidade
                    tipo = produto.tipo
                                        
                    self.tabela.rows.append(
                        ft.DataRow(
                            cells=[
                                ft.DataCell(ft.Text(str(id_))),
                                ft.DataCell(ft.Text(nome)),
                                ft.DataCell(ft.Text(descricao)),
                                ft.DataCell(ft.Text(f"R$ {preco:.2f}")),
                                ft.DataCell(ft.Text(str(quantidade))),
                                ft.DataCell(ft.Text(tipo)),
                                ft.DataCell(
                                    ft.Row([
                                        ft.IconButton(ft.icons.EDIT, on_click=partial(self.editar_produto, id_)),
                                        ft.IconButton(ft.icons.DELETE, on_click=partial(self.excluir_produto, id_)),
                                    ])
                                ),
                            ]
                        )
                    )
                print(f"Produtos carregados na tabela: {self.tabela.rows}")
        except ft.FletException as e:
            print(f"Erro ao carregar produtos: {e}")
        except Exception as e:
            print(f"Erro inesperado ao carregar produtos: {e}")
            
    def editar_produto(self, produto_id):
        print(f"Editar produto {produto_id}")

    def excluir_produto(self, produto_id):
        print(f"Excluir produto {produto_id}")

    def build(self):
        self.carregar_produtos()  # Carregar os produtos ao iniciar
        return ft.Column([
            ft.Text("Lista de Produtos", size=20, weight="bold"),
            self.tabela
        ])