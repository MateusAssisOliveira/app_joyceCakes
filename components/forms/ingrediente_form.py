from logs.logger import Logger
from typing import Any, Dict, List, Optional
import flet as ft
from time import time
import asyncio

class IngredienteForm:
    def __init__(self, produtos: List[Dict[str, Any]], page: ft.Page, logger: Logger):
        self.produtos = produtos
        self.page = page
        self.lista_ingredientes = ft.ListView(expand=True)
        self._last_search_time = 0
        self._search_task = None
        self.log = logger
        self.produto_selecionado = None
        
        self.log.debug("Inicializando IngredienteForm")
        self.log.debug(f"Produtos recebidos: {len(self.produtos)} itens")
        self._setup_ui()
    
    def _setup_ui(self):
        """Configura todos os elementos da interface do usuário"""
        self.log.debug("Configurando interface do usuário")
        
        # Campo de pesquisa
        self.campo_pesquisa = ft.TextField(
            label="Pesquisar ingrediente",
            height=30,
            expand=True,
            on_change=self._handle_search,
            text_align=ft.TextAlign.LEFT,
            text_size=12
        )
        
        # Lista de sugestões
        self.suggestions_list = ft.ListView(
            height=100,
            visible=False,
            padding=ft.padding.symmetric(vertical=5),
        )
        
        # Botão de adicionar
        self.botao_adicionar = ft.IconButton(
            icon=ft.Icons.ADD,
            on_click=lambda e: self._adicionar_ingrediente(getattr(self, 'produto_selecionado', None))
        )
        
        # Painel de sugestões
        suggestions_panel = ft.Container(
            content=self.suggestions_list,
            border=ft.border.all(1, ft.Colors.GREY_300),
            border_radius=5,
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=5,
                color=ft.Colors.BLACK26,
                offset=ft.Offset(0, 3),
            )
        )
        
        # Container principal
        self.search_container = ft.Container(
            content=ft.Column(
                controls=[
                    ft.Row([self.campo_pesquisa, self.botao_adicionar]),
                    suggestions_panel
                ],
                spacing=0,
            )
        )
        self.log.debug("Interface do usuário configurada com sucesso")
    
    def _make_suggestion_handler(self, produto):
        self.log.debug(f"Criando handler para sugestão: {produto.get('nome')}")
        async def handler(e):
            await self._selecionar_sugestao(produto)
        return handler
    
    async def _handle_search(self, e):
        """Manipula a pesquisa de ingredientes com debounce"""
        self.log.debug("Iniciando manipulação de pesquisa")
        self._last_search_time = time()
        await asyncio.sleep(0.3)
        
        if time() - self._last_search_time < 0.3:
            self.log.debug("Pesquisa ignorada (debounce)")
            return
        
        termo = self.campo_pesquisa.value.strip().lower()
        self.log.debug(f"Termo de pesquisa: '{termo}'")
        
        if self._search_task and not self._search_task.done():
            self.log.debug("Cancelando tarefa de pesquisa anterior")
            self._search_task.cancel()
        
        if len(termo) < 2:
            self.log.debug("Termo muito curto, ocultando sugestões")
            self.suggestions_list.visible = False
            self.page.update()
            return
        
        self.log.debug("Iniciando nova tarefa de pesquisa")
        self._search_task = asyncio.create_task(self._atualizar_sugestoes(termo))
    
    async def _atualizar_sugestoes(self, termo: str):
        """Atualiza a lista de sugestões com base no termo de pesquisa"""
        self.log.debug(f"Atualizando sugestões para o termo: '{termo}'")
        
        try:
            sugestoes = [
                p for p in self.produtos 
                if termo in p["nome"].lower()
            ][:5]
            
            self.log.debug(f"Encontradas {len(sugestoes)} sugestões")
            
            self.suggestions_list.controls.clear()
            
            for produto in sugestoes:
                self.log.debug(f"Adicionando sugestão: {produto['nome']}")
                self.suggestions_list.controls.append(
                    ft.ListTile(
                        title=ft.Text(produto["nome"]),
                        on_click=self._make_suggestion_handler(produto),
                    )
                )
            
            self.suggestions_list.visible = bool(sugestoes)
            self.page.update()
            self.log.debug("Sugestões atualizadas com sucesso")
            
        except Exception as e:
            self.log.error(f"Erro ao atualizar sugestões: {str(e)}")
            raise
    
    async def _selecionar_sugestao(self, produto: Dict[str, Any]):
        """Seleciona uma sugestão da lista"""
        self.log.debug(f"Selecionando sugestão: {produto['nome']}")
        
        try:
            self.campo_pesquisa.value = produto["nome"]
            self.suggestions_list.visible = False
            self.produto_selecionado = produto
            self.page.update()
            self.log.debug("Sugestão selecionada com sucesso")
        except Exception as e:
            self.log.error(f"Erro ao selecionar sugestão: {str(e)}")
            raise
    
    def _adicionar_ingrediente(self, ingrediente: Optional[Dict[str, Any]] = None):
        """Adiciona um novo ingrediente à lista"""
        if not ingrediente:
            nome = self.campo_pesquisa.value.strip()
            if not nome:
                self.log.debug("Ignorando adição de ingrediente vazio")
                return
            
            ingrediente = next((p for p in self.produtos if p['nome'].lower() == nome.lower()), None)
            if not ingrediente:
                self.log.warning(f"Ingrediente '{nome}' não encontrado na lista de produtos")
                ingrediente = {'nome': nome}
        
        self.log.debug(f"Adicionando ingrediente: {ingrediente.get('nome')}")
        
        try:
            # Criamos um container temporário sem referências ao card
            container = ft.Container(
                content=ft.Column([
                    ft.ListTile(
                        title=ft.Text(ingrediente['nome']),
                        subtitle=ft.Text(
                            f"{ingrediente.get('quantidade', '1')} - {ingrediente.get('unidade_medida', 'un')}",
                            size=12
                        ),
                    ),
                    ft.TextField(
                        label="Observações",
                        value=ingrediente.get('observacoes', ''),
                        text_size=12,
                        dense=True
                    )
                ]),
                padding=10,
            )

            # Agora criamos o card com o container
            card = ft.Card(
                content=container,
                data=ingrediente
            )

            # Configuramos os callbacks depois que o card existe
            delete_btn = ft.IconButton(icon=ft.Icons.DELETE)
            container.content.controls[0].trailing = delete_btn
            delete_btn.on_click = lambda e: self._remover_ingrediente(card)

            obs_field = container.content.controls[1]
            obs_field.on_change = lambda e: self._atualizar_observacoes(card, e.control.value)

            self.lista_ingredientes.controls.append(card)
            self.campo_pesquisa.value = ""
            self.produto_selecionado = None
            self.page.update()
            self.log.debug(f"Ingrediente '{ingrediente['nome']}' adicionado com sucesso")
            
        except Exception as e:
            self.log.error(f"Erro ao adicionar ingrediente: {str(e)}")
            raise
    
    def _atualizar_observacoes(self, card: ft.Card, observacoes: str):
        """Atualiza as observações do ingrediente"""
        card.data['observacoes'] = observacoes
        self.log.debug(f"Observações atualizadas para {card.data.get('nome')}")
    
    def _remover_ingrediente(self, card: ft.Card):
        """Remove um ingrediente da lista"""
        try:
            ingrediente = card.data.get("nome", "desconhecido")
            self.log.debug(f"Removendo ingrediente: {ingrediente}")
            self.lista_ingredientes.controls.remove(card)
            self.page.update()
            self.log.debug(f"Ingrediente {ingrediente} removido com sucesso")
        except Exception as e:
            self.log.error(f"Erro ao remover ingrediente: {str(e)}")
            raise
    
    def get_ingredientes(self) -> List[Dict[str, Any]]:
        """Retorna a lista completa de ingredientes adicionados com todos os dados"""
        self.log.debug("Obtendo lista completa de ingredientes")
        ingredientes = [item.data for item in self.lista_ingredientes.controls]
        self.log.debug(f"Retornando {len(ingredientes)} ingredientes com dados completos")
        return ingredientes
    
    def build(self):
        """Retorna o widget principal para exibição"""
        self.log.debug("Construindo componente principal")
        return self.search_container