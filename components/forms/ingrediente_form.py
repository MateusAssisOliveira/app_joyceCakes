from typing import Any, Dict, List, Optional
import flet as ft
from time import time
import asyncio

class IngredienteForm:
    def __init__(self, produtos: List[Dict[str, Any]], page: ft.Page):
        self.produtos = produtos
        self.page = page
        self.lista_ingredientes = ft.ListView(expand=True)
        self._last_search_time = 0
        self._search_task: Optional[asyncio.Task] = None
        self._setup_campos_ingrediente()
    
    def _setup_campos_ingrediente(self):
        self.campo_pesquisa_ingrediente = ft.TextField(
            label="Pesquisar ingrediente",
            height=25,
            expand=True,
            on_change=self._handle_search_change,
        )
        
        self.suggestions_panel = ft.ListView(
            height=200,
            visible=False,
            #bgcolor=ft.Colors.WHITE,
            padding=ft.padding.symmetric(vertical=5),
        )
        
        self.search_container = ft.Column(
            [
                self.campo_pesquisa_ingrediente,
                ft.Container(
                    content=self.suggestions_panel,
                    border=ft.border.all(1, ft.Colors.GREY_300),
                    border_radius=5,
                    shadow=ft.BoxShadow(
                        spread_radius=1,
                        blur_radius=5,
                        color=ft.Colors.BLACK26,
                        offset=ft.Offset(0, 3),
                    ),
                ),
            ],
            spacing=0,
        )
        
        self.botao_add_ingrediente = ft.IconButton(icon=ft.Icons.ADD)
    
    async def _handle_search_change(self, e):

        self._last_search_time = time()

        await asyncio.sleep(0.3)
        if time() - self._last_search_time < 0.3:
            return
        
        search_term = self.campo_pesquisa_ingrediente.value.strip().lower()
        print(f" - {search_term}")
        
        if self._search_task and not self._search_task.done():
            self._search_task.cancel()
        
        if len(search_term) < 2:
            self.suggestions_panel.visible = False
            self.page.update()
            return
        
        self._search_task = asyncio.create_task(self._update_suggestions(search_term))
    
    async def _update_suggestions(self, search_term: str):

        print('Entrou aqui')
        filtered = [
            p for p in self.produtos 
            if search_term in p["nome"].lower()
        ][:5]
        
        self.suggestions_panel.controls.clear()
        print(self.produtos)
        print(filtered)
        
        for produto in filtered:
            self.suggestions_panel.controls.append(
                ft.ListTile(
                    title=ft.Text(produto["nome"]),
                    on_click=lambda e, p=produto: self._select_suggestion(p),
                )
            )
        
        self.suggestions_panel.visible = bool(filtered)
        self.page.update()
    
    async def _select_suggestion(self, produto: Dict[str, Any]):
        self.campo_pesquisa_ingrediente.value = produto["nome"]
        self.suggestions_panel.visible = False
        self.page.update()
        
        # Aqui você pode adicionar lógica adicional após selecionar um item
    
    def adicionar_ingrediente_ui(self, ingrediente: Dict[str, Any]):
        card = ft.Card(
            content=ft.Container(
                content=ft.Column([
                    ft.ListTile(
                        title=ft.Text(ingrediente["nome"]),
                        subtitle=ft.Text(f"{ingrediente['quantidade']} {ingrediente['unidade']}"),
                        trailing=ft.IconButton(
                            icon=ft.Icons.DELETE,
                            on_click=lambda e, card=card: self._remover_ingrediente(e, card)
                        ),
                    ),
                    ft.Text(ingrediente.get("observacoes", ""), size=12) 
                    if ingrediente.get("observacoes") else None
                ]),
                padding=10,
            ),
            data=ingrediente
        )
        self.lista_ingredientes.controls.append(card)
        self.page.update()
    
    def _remover_ingrediente(self, e, card: ft.Card):
        self.lista_ingredientes.controls.remove(card)
        self.page.update()
    
    def get_ingredientes(self) -> List[Dict[str, Any]]:
        return [item.data for item in self.lista_ingredientes.controls]