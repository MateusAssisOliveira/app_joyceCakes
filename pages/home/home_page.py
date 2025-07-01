import flet as ft

def home_page(page: ft.Page) -> ft.View:
    return ft.View(
        route="/",
        controls=[
            ft.Column(
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                expand=True,
                controls=[
                    ft.Text("Bem-vindo ao Sistema --", size=30, weight=ft.FontWeight.BOLD),
                    ft.Text("Escolha uma opção para continuar.", size=18),
                    ft.ElevatedButton(
                        text="Ir para Receitas",
                        on_click=lambda e: page.go("/receitas")
                    ),
                ]
            )
        ]
    )
