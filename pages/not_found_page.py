import flet as ft

def not_found_page(page: ft.Page) -> ft.View:
    return ft.View(
        route="/404",
        controls=[
            ft.Column(
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                expand=True,
                controls=[
                    ft.Text("404", size=60, weight=ft.FontWeight.BOLD, color="red"),
                    ft.Text("Página não encontrada", size=25, weight=ft.FontWeight.W_500),
                    ft.Text("A rota que você tentou acessar não existe.", size=16),
                    ft.ElevatedButton(
                        text="Voltar à página inicial",
                        on_click=lambda e: page.go("/")
                    ),
                ]
            )
        ]
    )
