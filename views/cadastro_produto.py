import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

class CadastroProduto(ft.AlertDialog):
    def __init__(self, on_save):
        super().__init__()
        self.on_save = on_save
        self.title = ft.Text("Cadastro de Produto")
        self.nome = ft.TextField(label="Nome")
        self.descricao = ft.TextField(label="Descrição")
        self.preco = ft.TextField(label="Preço")
        self.quantidade = ft.TextField(label="Quantidade")
        
        self.quantidade.keyboard_type = ft.KeyboardType.NUMBER
        self.preco.keyboard_type = ft.KeyboardType.NUMBER
        self.nome.autofocus = True
        self.descricao.autofocus = False
        self.preco.autofocus = False
        self.quantidade.autofocus = False
        
        self.tipo = ft.Dropdown(
            label="Tipo",
            options=[
                ft.dropdown.Option("unidade"),
                ft.dropdown.Option("peso")
            ],
            value="unidade"
        )

        self.content = ft.Column([
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
        try:
            
            novo_produto = Produto(
                nome=self.nome.value,
                descricao=self.descricao.value,
                preco=float(self.preco.value),
                quantidade=int(self.quantidade.value),
                tipo=self.tipo.value
            )
                       
            print(f"Produto a ser cadastrado: {novo_produto}")
            # Chama o método de cadastro do controller
            # e passa o novo produto como argumento
            
            ProdutoController.cadastrar_produto(novo_produto)
            self.open = False
            self.on_save()  # Atualiza a lista após salvar
        except Exception as err:
            print(f"Erro ao salvar produto: {err}")
        self.update()
