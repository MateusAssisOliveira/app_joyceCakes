import flet as ft

class NavebarSuperiorEstoque(ft.Container):
    def __init__(self, on_adicionar, on_buscar, on_editar, on_remover):
        super().__init__()
        self.bgcolor = ft.colors.SURFACE_VARIANT
        self.padding = 15
        self.shadow = ft.BoxShadow(blur_radius=8, color=ft.colors.BLACK38)
        self.content = ft.Column([
            ft.Row([
                ft.Text("Estoque", size=24, weight="bold"),
                ft.Icon(name=ft.icons.STORE),
            ], alignment="spaceBetween"),
            
            ft.Row([
                ft.TextField(
                    label="Buscar produto...",
                    expand=True,
                    on_submit=lambda e: on_buscar(e.control.value)
                ),
                ft.ElevatedButton("Buscar", icon=ft.icons.SEARCH, on_click=lambda e: on_buscar(self.controls[1].controls[0].value)),
                ft.ElevatedButton("Novo Produto", icon=ft.icons.ADD, on_click=on_adicionar),
                ft.ElevatedButton("Editar Produto", icon=ft.icons.EDIT, on_click=on_editar),
                ft.ElevatedButton("Remover Produto", icon=ft.icons.DELETE, on_click=on_remover),
            ], spacing=10, expand=True)
        ], spacing=15)

# Uso na página principal
def main(page: ft.Page):
    navbar = NavebarSuperiorEstoque(
        on_adicionar=lambda e: print("Adicionar"),
        on_buscar=lambda txt: print(f"Buscar: {txt}"),
        on_editar=lambda e: print("Editar"),
        on_remover=lambda e: print("Remover")
    )
    
    # Configurar posição fixa
    navbar.top = 0
    navbar.left = 0
    navbar.right = 0
    navbar.z_index = 1000  # Garante que fique acima de outros elementos
    
    # Conteúdo principal precisa de margem superior
    conteudo = ft.Column(
        controls=[ft.Text("Conteúdo principal..." * 500)],
        scroll=ft.ScrollMode.AUTO,
        margin=ft.margin.only(top=120)  # Ajuste conforme altura da navbar
    )
    
    page.add(
        ft.Stack(
            controls=[
                conteudo,
                navbar
            ],
            expand=True
        )
    )