# views/paginacao.py
import flet as ft
from typing import Callable

class Paginacao(ft.Row):
    def __init__(self, on_mudar_pagina: Callable, on_alterar_itens_por_pagina: Callable):
        super().__init__()
        self.on_mudar_pagina = on_mudar_pagina
        self.on_alterar_itens_por_pagina = on_alterar_itens_por_pagina
        
        # Configuração do layout
        self.alignment = ft.MainAxisAlignment.CENTER
        self.spacing = 20
        self.vertical_alignment = ft.CrossAxisAlignment.CENTER
        
        # Componentes
        self.texto_pagina = ft.Text("1", size=16, weight="bold")
        self.texto_total = ft.Text("", size=14)
        
        self.controls = [
            
            ft.IconButton(
                icon=ft.icons.ARROW_BACK,
                on_click=lambda _: self.on_mudar_pagina(-1),
                tooltip="Página anterior",
                icon_size=24
            ),
            self.texto_pagina,
            ft.IconButton(
                icon=ft.icons.ARROW_FORWARD,
                on_click=lambda _: self.on_mudar_pagina(1),
                tooltip="Próxima página",
                icon_size=24
            ),
            ft.Text("Itens por página:", size=14),
            ft.Dropdown(
                options=[
                    ft.dropdown.Option("10"),
                    ft.dropdown.Option("20"),
                    ft.dropdown.Option("50"),
                    ft.dropdown.Option("100"),
                ],
                value="20",
                width=100,
                text_size=12,
                on_change=self.on_alterar_itens_por_pagina
            ),
            self.texto_total
        ]
        self._initialized = True
    
    def atualizar(self, pagina_atual: int, total_paginas: int, total_itens: int):
        if not self._initialized:
            return
            
        self.texto_pagina.value = str(pagina_atual)
        self.texto_total.value = f"de {total_paginas} | Total: {total_itens} itens"
        
        # Verifica se o controle já foi adicionado à página antes de atualizar
        if hasattr(self, 'page') and self.page:
            self.update()