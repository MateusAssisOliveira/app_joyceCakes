import flet as ft
from logs.logger import Logger

log = Logger()

class NavBar:
    def __init__(self, page_title="Minha Página"):
        self.page_title = page_title
        

    def build(self):
        return ft.Column(
            controls=[
                # Primeira linha: botão Home à esquerda, título centralizado
                ft.Container(
                    content=ft.Row(
                        controls=[
                            ft.Container(
                                content=ft.ElevatedButton(text='Home', icon=ft.Icons.HOME),
                                border=ft.border.all(1, "blue"),
                                padding=1
                            ),
                            ft.Container(
                                content=ft.Text(self.page_title, size=20, weight=ft.FontWeight.BOLD),
                                alignment=ft.alignment.center,
                                expand=True,
                                border=ft.border.all(1, "green"),
                                padding=1
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.START
                    ),
                    border=ft.border.all(2, "red"),
                    padding=1
                ),

                # Segunda linha: ações centralizadas
                ft.Container(
                    content=ft.Row(
                        controls=[
                            ft.Container(
                                content=ft.ElevatedButton(text='Novo', icon=ft.Icons.ADD),
                                border=ft.border.all(1, "purple"),
                                padding=1
                            ),
                            ft.Container(
                                content=ft.ElevatedButton(text='Editar', icon=ft.Icons.EDIT),
                                border=ft.border.all(1, "purple"),
                                padding=1
                            ),
                            ft.Container(
                                content=ft.ElevatedButton(text='Deletar', icon=ft.Icons.DELETE),
                                border=ft.border.all(1, "purple"),
                                padding=1
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.CENTER
                    ),
                    border=ft.border.all(2, "orange"),
                    padding=1
                ),
            ],
            spacing=1
        )
