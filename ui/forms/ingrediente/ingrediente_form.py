
from logs.logger import Logger
from typing import Any, Dict, List, Optional, TypedDict
import flet as ft
from time import time
import asyncio

from ui.forms.ingrediente.ingrediente_data import IngredienteData
from ui.forms.ingrediente.ingrediente_service import IngredienteService
from ui.forms.ingrediente.ingrediente_ui import IngredienteUI


class IngredienteForm:
    def __init__(self, produtos: List[Dict[str, Any]], page: ft.Page, logger: Logger):
        self.page = page
        self.log = logger
        
        # Inicializa serviços
        self.ui = IngredienteUI(page, logger)
        self.service = IngredienteService(produtos, logger)
        
        # Componentes UI
        self.lista_ingredientes = ft.ListView(expand=True)
        self.campo_pesquisa = self.ui.criar_campo_pesquisa()
        self.campo_valor_medida= self.ui.criar_campo_valor_medida()
        self.suggestions_list = self.ui.criar_lista_sugestoes()
        self.botao_adicionar = self.ui.criar_botao_adicionar()
        
        # Configura eventos
        self._setup_event_handlers()
        
        # Estado
        self._last_search_time = 0
        self._search_task = None
        self.produto_selecionado = None
        
        self.log.debug("Inicializando IngredienteForm")
        self._setup_ui()
    
    def _setup_ui(self):
        """Configura a interface do usuário"""
        self.log.debug("Configurando interface do usuário")
        
        suggestions_panel = self.ui.criar_painel_sugestoes(self.suggestions_list)
        
        self.search_container = ft.Container(
            content=ft.Column(
                controls=[
                    ft.Row([self.campo_pesquisa, self.campo_valor_medida,self.botao_adicionar]),
                    suggestions_panel
                ],
                spacing=0,
            )
        )
        self.log.debug("Interface do usuário configurada com sucesso")
    
    def _setup_event_handlers(self):
        """Configura todos os handlers de eventos"""
        self.campo_pesquisa.on_change = self._handle_search
        self.botao_adicionar.on_click = lambda e: self._adicionar_ingrediente()
    
    async def _handle_search(self, e):
        """Manipula a pesquisa de ingredientes com debounce"""
        self._last_search_time = time()
        await asyncio.sleep(0.3)
        
        if time() - self._last_search_time < 0.3:
            self.log.debug("Pesquisa ignorada (debounce)")
            return
        
        termo = self.campo_pesquisa.value.strip().lower()
        self.log.debug(f"Termo de pesquisa: '{termo}'")
        
        if self._search_task and not self._search_task.done():
            self._search_task.cancel()
        
        if len(termo) < 2:
            self.suggestions_list.visible = False
            self.page.update()
            return
        
        self._search_task = asyncio.create_task(self._atualizar_sugestoes(termo))

    def _make_suggestion_handler(self, produto):
        self.log.debug(f"Criando handler para sugestão: {produto.get('nome')}")
        async def handler(e):
            await self._selecionar_sugestao(produto)
        return handler
    
    async def _atualizar_sugestoes(self, termo: str):
        """Atualiza a lista de sugestões com base no termo de pesquisa"""
        try:
            sugestoes = self.service.pesquisar_ingredientes(termo)
            self.log.debug(f"Encontradas {len(sugestoes)} sugestões")
            
            self.suggestions_list.controls.clear()
            
            for produto in sugestoes:
                item = self.ui.criar_item_sugestao(produto)
                item.on_click = self._make_suggestion_handler(produto)
                self.suggestions_list.controls.append(item)
            
            self.suggestions_list.visible = bool(sugestoes)
            self.page.update()
            
        except Exception as e:
            self.log.error(f"Erro ao atualizar sugestões: {str(e)}")
            raise
    
    async def _selecionar_sugestao(self, produto: IngredienteData):
        """Seleciona uma sugestão da lista"""
        try:
            self.campo_pesquisa.value = produto["nome_produto"]
            self.suggestions_list.visible = False
            self.produto_selecionado = produto
            self.page.update()
            self.log.debug("Sugestão selecionada com sucesso")
        except Exception as e:
            self.log.error(f"Erro ao selecionar sugestão: {str(e)}")
            raise
    
    def _adicionar_ingrediente(self, ingrediente: Optional[IngredienteData] = None):
        """Adiciona um novo ingrediente à lista"""
        try:
            if not ingrediente:
                nome = self.campo_pesquisa.value.strip()
                ingrediente = self.service.validar_ingrediente(nome)
                if not ingrediente:
                    return
            quantidade = self.campo_valor_medida.value.strip()
            self.log.debug(f"Adicionando ingrediente: {ingrediente.get('nome_produto')}")
            
            card = self.ui.criar_card_ingrediente(ingrediente,quantidade)
            self._configurar_eventos_card(card)
            
            self.lista_ingredientes.controls.append(card)
            self._limpar_campos_pesquisa()
            self._limpar_campos_unidade_medida()
            self.page.update()
            self.log.debug(f"Ingrediente '{ingrediente['nome_produto']}' adicionado com sucesso")
            
        except Exception as e:
            self.log.error(f"Erro ao adicionar ingrediente: {str(e)}")
            raise
    
    def _configurar_eventos_card(self, card: ft.Card):
        """Configura os eventos para um card de ingrediente"""
        delete_btn = ft.IconButton(icon=ft.Icons.DELETE)
        container = card.content
        container.content.controls[0].trailing = delete_btn
        delete_btn.on_click = lambda e, c=card: self._remover_ingrediente(c)
    
    def _limpar_campos_pesquisa(self):
        """Limpa os campos de pesquisa após adição"""
        self.campo_pesquisa.value = ""
        self.produto_selecionado = None

    def _limpar_campos_unidade_medida(self):
        """Limpa os campos de pesquisa após adição"""
        self.campo_valor_medida.value = ""
    
    def _remover_ingrediente(self, card: ft.Card):
        """Remove um ingrediente da lista"""
        try:
            ingrediente = card.data.get("nome_produto", "desconhecido")
            self.log.debug(f"Removendo ingrediente: {ingrediente}")
            self.lista_ingredientes.controls.remove(card)
            self.page.update()
        except Exception as e:
            self.log.error(f"Erro ao remover ingrediente: {str(e)}")
            raise
    
    def get_ingredientes(self) -> List[IngredienteData]:
        """Retorna a lista completa de ingredientes adicionados"""
        return [item.data for item in self.lista_ingredientes.controls]
    
    def build(self):
        """Retorna o widget principal para exibição"""
        return self.search_container
    
    def get_lista_ingredientes(self):
        return self.lista_ingredientes