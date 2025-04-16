import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

class CadastroProduto(ft.AlertDialog):
    def __init__(self, on_save):
        super().__init__()
        self.on_save = on_save
        self.title = ft.Text("Cadastro de Produto")

        self.mensagem_erro = ft.Text("", color="red")

        self.nome = ft.TextField(label="Nome", autofocus=True)
        self.descricao = ft.TextField(label="Descrição")

        self.preco = ft.TextField(
            label="Preço",
            keyboard_type=ft.KeyboardType.NUMBER,
            input_filter=ft.InputFilter.allow_digits(True, decimal=True)
        )
        self.quantidade = ft.TextField(
            label="Quantidade",
            keyboard_type=ft.KeyboardType.NUMBER,
            input_filter=ft.InputFilter.allow_digits(True)
        )

        self.tipo = ft.Dropdown(
            label="Tipo",
            options=[
                ft.dropdown.Option("unidade"),
                ft.dropdown.Option("peso")
            ],
            value="unidade"
        )

        self.content = ft.Column([
            self.mensagem_erro,
            self.nome,
            self.descricao,
            self.preco,
            self.quantidade,
            self.tipo
        ])

        self.actions = [
            ft.TextButton("Cancelar", on_click=self.cancelar),
            ft.ElevatedButton("Salvar", on_click=self.salvar)
        ]

    def cancelar(self, e):
        self.open = False
        self.update()

    def salvar(self, e):
        # Limpa mensagem anterior
        self.mensagem_erro.value = ""
        self.update()

        try:
            nome = self.nome.value.strip()
            descricao = self.descricao.value.strip()
            tipo = self.tipo.value

            # Valida nome
            if not nome:
                self.mostrar_erro("Nome do produto não pode ser vazio.")
                return

            # Valida preço
            try:
                preco = float(self.preco.value)
                if preco < 0:
                    raise ValueError
            except ValueError:
                self.mostrar_erro("Preço inválido. Use um número positivo.")
                return

            # Valida quantidade
            try:
                quantidade = int(self.quantidade.value)
                if quantidade < 0:
                    raise ValueError
            except ValueError:
                self.mostrar_erro("Quantidade inválida. Use um número inteiro positivo.")
                return

            novo_produto = Produto(
                nome=nome,
                descricao=descricao,
                preco=preco,
                quantidade=quantidade,
                tipo=tipo
            )

            ProdutoController.cadastrar_produto(novo_produto)
            self.open = False
            self.on_save()

        except Exception as err:
            self.mostrar_erro(f"Erro inesperado: {err}")
        self.update()

    def mostrar_erro(self, mensagem):
        self.mensagem_erro.value = mensagem
        self.update()
