from logs.logger import Logger
import flet as ft

# dialogue.py
class DialogAdicionarProduto:
    def __init__(self):
        self.log = Logger()
        self.log.info("Iniciando o Dialogue")

        self.campo_nome = ft.TextField(label="Nome")
        self.campo_quantidade = ft.TextField(label="Quantidade")
        self.dialog = ft.AlertDialog(
            title=ft.Text("Adicionar Produto"),
            content=ft.Column([self.campo_nome, self.campo_quantidade]),
            actions=[]
        )

    def abrir(self, page, on_salvar):
        self.log.info("Abrindo Dialogue")
        
        # Verifique o tipo e as propriedades da page
        self.log.debug(f"Tipo de page: {type(page)}")
        self.log.debug(f"Propriedades de page: {dir(page)}")
        
        def salvar(e):
            dados = {
                "nome": self.campo_nome.value,
                "quantidade": self.campo_quantidade.value
            }
            on_salvar(dados)
            page.dialog.open = False
            page.update()

        self.dialog.actions = [
            ft.TextButton("Salvar", on_click=salvar),
            ft.TextButton("Cancelar", on_click=lambda e: setattr(page.dialog, "open", False))
        ]
        
        self.dialog.open = True
        page.update()