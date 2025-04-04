import flet as ft
from controllers.produto_controller import ProdutoController

class CadastroProduto(ft.Column):
    def __init__(self):
        super().__init__()

        self.nome = ft.TextField(label="Nome do Produto", width=300)
        self.descricao = ft.TextField(label="Descrição", multiline=True, width=300)
        self.preco = ft.TextField(label="Preço (R$)", width=150, keyboard_type=ft.KeyboardType.NUMBER)
        self.quantidade = ft.TextField(label="Quantidade", width=150, keyboard_type=ft.KeyboardType.NUMBER)
        self.tipo = ft.Dropdown(
            label="Tipo",
            options=[ft.dropdown.Option("unidade"), ft.dropdown.Option("peso")],
            width=150
        )

        self.botao_cadastrar = ft.ElevatedButton("Cadastrar", on_click=self.salvar_produto)

        # Adiciona os elementos na Column
        self.controls = [
            self.nome,
            self.descricao,
            ft.Row([self.preco, self.quantidade, self.tipo]),
            self.botao_cadastrar
        ]

    def salvar_produto(self, e):
        sucesso, mensagem = ProdutoController.cadastrar_produto(
            self.nome.value, self.descricao.value, self.preco.value,
            self.quantidade.value, self.tipo.value
        )

        snackbar = ft.SnackBar(content=ft.Text(mensagem), bgcolor="green" if sucesso else "red")
        self.page.snack_bar = snackbar
        self.page.snack_bar.open = True

        if sucesso:
            self.nome.value = self.descricao.value = self.preco.value = self.quantidade.value = ""
            self.tipo.value = None

        self.update()  # Atualiza a tela
