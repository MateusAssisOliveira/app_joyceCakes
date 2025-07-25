from logs.logger import Logger
from typing import Any, Dict, List, Optional, TypedDict
import flet as ft
from time import time
import asyncio

from ui.forms.add_ingrediente_dialog_receita.ingrediente_data import IngredienteData
from services.ingredientes.ingrediente_service import IngredienteService
from ui.forms.add_ingrediente_dialog_receita.ingrediente_ui import IngredienteUI
from util.retornos import Retorno


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
        self.campo_valor_medida = self.ui.criar_campo_valor_medida()
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
    
    def _setup_ui(self) -> Dict[str, Any]:
        """Configura a interface do usuário"""
        try:
            self.log.debug("Configurando interface do usuário")
            
            suggestions_panel = self.ui.criar_painel_sugestoes(self.suggestions_list)
            
            self.search_container = ft.Container(
                content=ft.Column(
                    controls=[
                        ft.Row([self.campo_pesquisa, self.campo_valor_medida, self.botao_adicionar]),
                        suggestions_panel
                    ],
                    spacing=0,
                )
            )
            self.log.debug("Interface do usuário configurada com sucesso")
            return Retorno.sucesso("Interface configurada com sucesso")
        except Exception as e:
            error_msg = f"Erro ao configurar interface: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def _setup_event_handlers(self) -> Dict[str, Any]:
        """Configura todos os handlers de eventos"""
        try:
            self.campo_pesquisa.on_change = self._handle_search
            self.botao_adicionar.on_click = lambda e: self._adicionar_ingrediente()
            return Retorno.sucesso("Event handlers configurados com sucesso")
        except Exception as e:
            error_msg = f"Erro ao configurar event handlers: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    async def _handle_search(self, e) -> Dict[str, Any]:
        """Manipula a pesquisa de ingredientes com debounce"""
        try:
            self._last_search_time = time()
            await asyncio.sleep(0.3)
            
            if time() - self._last_search_time < 0.3:
                self.log.debug("Pesquisa ignorada (debounce)")
                return Retorno.sucesso("Pesquisa ignorada (debounce)")
            
            termo = self.campo_pesquisa.value.strip().lower()
            self.log.debug(f"\n\nTermo de pesquisa: '{termo}'")
            
            if self._search_task and not self._search_task.done():
                self._search_task.cancel()
            
            if len(termo) < 2:
                self.suggestions_list.visible = False
                self.page.update()
                return Retorno.sucesso("Termo de pesquisa muito curto")
            
            self._search_task = asyncio.create_task(self._atualizar_sugestoes(termo))
            return Retorno.sucesso("Pesquisa iniciada com sucesso")
            
        except Exception as e:
            error_msg = f"Erro ao processar pesquisa: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _make_suggestion_handler(self, produto) -> Dict[str, Any]:
        """Cria handler para seleção de sugestão"""
        try:
            self.log.debug(f"\n\nCriando handler para sugestão: {produto.get('nome_produto')}")
            async def handler(e):
                return await self._selecionar_sugestao(produto)
            return handler
        except Exception as e:
            error_msg = f"Erro ao criar suggestion handler: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    async def _atualizar_sugestoes(self, termo: str) -> Dict[str, Any]:
        """Atualiza a lista de sugestões com base no termo de pesquisa
        
        Args:
            termo: Termo de pesquisa para ingredientes
            
        Returns:
            Dict[str, Any]: Retorno padronizado com sugestões ou erro
        """
        try:
            self.log.info(f"Iniciando busca por sugestões: '{termo}'")

            # 1. Validação do termo
            if not termo or len(termo.strip()) < 2:
                self.suggestions_list.controls.clear()
                self.suggestions_list.visible = False
                self.page.update()
                return Retorno.sucesso("Termo muito curto - lista limpa", [])

            # 2. Pesquisa no service
            resultado = self.service.pesquisar_ingredientes(termo)
            
            if not resultado.get("ok", False):
                self.log.warning(f"Falha na pesquisa: {resultado.get('mensagem')}")
                return resultado  

            sugestoes = resultado['dados']
            self.log.debug(f"Encontradas {len(sugestoes)} sugestões válidas")

            # 3. Atualização da UI
            self.suggestions_list.controls.clear()
            
            for produto in sugestoes:
                try:
                    item = self.ui.criar_item_sugestao(produto)
                    item.on_click = self._make_suggestion_handler(produto)
                    self.suggestions_list.controls.append(item)
                except Exception as e:
                    self.log.error(f"Erro ao criar item para {produto.get('nome_produto')}: {str(e)}")
                    continue

            self.suggestions_list.visible = bool(sugestoes)
            self.page.update()
            
            return Retorno.sucesso(
                f"Exibindo {len(sugestoes)} sugestões",
                {"quantidade": len(sugestoes), "termo": termo}
            )
            
        except Exception as e:
            error_msg = f"Erro crítico ao atualizar sugestões: {str(e)}"
            self.log.error(error_msg, exc_info=True)
            
            # Garante que a UI seja atualizada mesmo em caso de erro
            self.suggestions_list.visible = False
            self.page.update()
            
            return Retorno.erro(error_msg)
    
    async def _selecionar_sugestao(self, produto: IngredienteData) -> Dict[str, Any]:
        """Seleciona uma sugestão da lista"""
        try:
            self.campo_pesquisa.value = produto["nome_produto"]
            self.suggestions_list.visible = False
            self.produto_selecionado = produto
            self.page.update()
            self.log.debug("Sugestão selecionada com sucesso")
            return Retorno.sucesso("Sugestão selecionada com sucesso", produto)
        except Exception as e:
            error_msg = f"Erro ao selecionar sugestão: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def _adicionar_ingrediente(self, ingrediente: Optional[IngredienteData] = None) -> Dict[str, Any]:
        """Adiciona um novo ingrediente à lista"""
        try:
            if not ingrediente:
                nome = self.campo_pesquisa.value.strip()
                resultado = self.service.validar_ingrediente(nome)
                
                if not resultado.get("ok", False):
                    return resultado
                    
                ingrediente = resultado['dados']
                
            quantidade = self.campo_valor_medida.value.strip()
            self.log.debug(f"\n\nAdicionando ingrediente: {ingrediente.get('nome_produto')}")
            
            card = self.ui.criar_card_ingrediente(ingrediente, quantidade)
            self._configurar_eventos_card(card)
            
            self.lista_ingredientes.controls.append(card)
            self._limpar_campos_pesquisa()
            self._limpar_campos_unidade_medida()
            self.page.update()
            
            self.log.debug(f"\n\nIngrediente '{ingrediente['nome_produto']}' adicionado com sucesso")
            return Retorno.sucesso("Ingrediente adicionado com sucesso", ingrediente)
            
        except Exception as e:
            error_msg = f"Erro ao adicionar ingrediente: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def _configurar_eventos_card(self, card: ft.Card) -> Dict[str, Any]:
        """Configura os eventos para um card de ingrediente"""
        try:
            delete_btn = ft.IconButton(icon=ft.Icons.DELETE)
            container = card.content
            container.content.controls[0].trailing = delete_btn
            delete_btn.on_click = lambda e, c=card: self._remover_ingrediente(c)
            return Retorno.sucesso("Eventos do card configurados com sucesso")
        except Exception as e:
            error_msg = f"Erro ao configurar eventos do card: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def _limpar_campos_pesquisa(self) -> Dict[str, Any]:
        """Limpa os campos de pesquisa após adição"""
        try:
            self.campo_pesquisa.value = ""
            self.produto_selecionado = None
            return Retorno.sucesso("Campos de pesquisa limpos com sucesso")
        except Exception as e:
            error_msg = f"Erro ao limpar campos de pesquisa: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _limpar_campos_unidade_medida(self) -> Dict[str, Any]:
        """Limpa os campos de unidade de medida após adição"""
        try:
            self.campo_valor_medida.value = ""
            return Retorno.sucesso("Campos de unidade de medida limpos com sucesso")
        except Exception as e:
            error_msg = f"Erro ao limpar campos de unidade de medida: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def _remover_ingrediente(self, card: ft.Card) -> Dict[str, Any]:
        """Remove um ingrediente da lista"""
        try:
            ingrediente = card.data.get("nome_produto", "desconhecido")
            self.log.debug(f"\n\nRemovendo ingrediente: {ingrediente}")
            self.lista_ingredientes.controls.remove(card)
            self.page.update()
            return Retorno.sucesso("Ingrediente removido com sucesso", {"nome_produto": ingrediente})
        except Exception as e:
            error_msg = f"Erro ao remover ingrediente: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def get_ingredientes(self) -> Dict[str, Any]:
        """Retorna a lista completa de ingredientes adicionados"""
        try:
            ingredientes = [item.data for item in self.lista_ingredientes.controls]
            return Retorno.sucesso("Lista de ingredientes obtida com sucesso", ingredientes)
        except Exception as e:
            error_msg = f"Erro ao obter lista de ingredientes: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def build(self) -> Dict[str, Any]:
        """Retorna o widget principal para exibição"""
        try:
            return Retorno.sucesso("Widget principal construído com sucesso", {"widget": self.search_container})
        
        except Exception as e:
            error_msg = f"Erro ao construir widget principal: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
    
    def get_lista_ingredientes(self) -> Dict[str, Any]:
        """Retorna a lista de ingredientes como controle Flet"""
        try:
            return Retorno.sucesso("Lista de ingredientes obtida com sucesso", {"lista": self.lista_ingredientes})
        except Exception as e:
            error_msg = f"Erro ao obter lista de ingredientes: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)