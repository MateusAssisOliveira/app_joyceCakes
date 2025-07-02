import flet as ft

class ProdutoFormFields:
    def __init__(self):
        self.id = ft.TextField(visible=False, read_only=True)
        self.nome = ft.TextField(label="Nome*", autofocus=True, dense=True, content_padding=12)
        self.descricao = ft.TextField(label="Descrição", multiline=True, dense=True, content_padding=12)
        self.preco = ft.TextField(label="Preço*", prefix_text="R$ ", dense=True, content_padding=12)
        self.estoque_minimo = ft.TextField(label="Estoque mínimo*", value="1", dense=True, content_padding=12)
        self.unidade_medida = ft.Dropdown(label="Unidade*", dense=True, content_padding=12)
        self.categoria = ft.Dropdown(label="Categoria*", dense=True, content_padding=12)
        self.ativo = ft.Checkbox(label="Produto ativo", value=True)
