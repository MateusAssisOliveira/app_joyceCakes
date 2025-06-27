# components/receita_bloco.py
import flet as ft
from logs.logger import Logger
from decimal import Decimal
from typing import Optional, List, Dict, Union
from datetime import timedelta

class ReceitaBloco:
    """Componente moderno para exibição de receitas com design sofisticado"""

    def __init__(self, theme: Optional[dict] = None):
        self.log = Logger()
        self.theme = theme or {
            'primary': ft.Colors.PINK_700,
            'on_primary': ft.Colors.WHITE,
            'secondary': ft.Colors.AMBER_600,
            'background': ft.Colors.GREY_50,
            'surface': ft.Colors.WHITE,
            'text': ft.Colors.GREY_900,
            'accent': ft.Colors.TEAL_400
        }
        self.log.info("Componente ReceitaBloco inicializado")

    def criar_bloco(self, receita: Dict) -> ft.Container:
        """Cria um bloco visual moderno para uma receita"""
        try:
            self.log.debug(f"Criando bloco para receita: {receita.get('nome_receita', 'Desconhecida')}")
            
            return ft.Container(
                content=self._criar_conteudo_bloco(receita),
                padding=ft.padding.symmetric(horizontal=20, vertical=15),
                border=ft.border.all(1, ft.Colors.GREY_200),
                border_radius=15,
                bgcolor=self.theme['surface'],
                width=420,
                shadow=ft.BoxShadow(
                    spread_radius=1,
                    blur_radius=15,
                    color=ft.Colors.GREY_300,
                    offset=ft.Offset(0, 3)
                ),
                animate=ft.Animation(300, ft.AnimationCurve.EASE_OUT),
                on_hover=self._handle_hover,
                on_click=lambda e: self._handle_clique_bloco(e, receita['id'])
            )
        except Exception as e:
            self.log.error(f"Erro ao criar bloco: {str(e)}")
            return ft.Container(
                content=ft.Text("Erro ao exibir receita"),
                padding=10,
                bgcolor=ft.Colors.RED_50,
                border_radius=10
            )

    def _criar_conteudo_bloco(self, receita: Dict) -> ft.Column:
        """Cria a estrutura interna do bloco com layout moderno"""
        ingredientes = receita.get('ingredientes', [])
        
        return ft.Column(
            controls=[
                self._criar_cabecalho(receita),
                ft.Divider(height=10, color=ft.Colors.TRANSPARENT),
                self._criar_detalhes(receita),
                ft.Divider(color=self.theme['primary'], height=1),
                self._criar_secao("📝 Modo de Preparo", receita.get('modo_preparo', 'Não especificado')),
                ft.Divider(color=self.theme['primary'], height=1),
                self._criar_chips_ingredientes(ingredientes),
                self._criar_botoes_acao(receita['id'])
            ],
            spacing=8
        )

    def _criar_cabecalho(self, receita: Dict) -> ft.Row:
        """Cabeçalho moderno com nome da receita e badge de categoria"""
        return ft.Row(
            controls=[
                ft.Text(
                    receita.get('nome_receita', 'Receita sem nome').title(),
                    size=20,
                    weight=ft.FontWeight.BOLD,
                    color=self.theme['primary'],
                    expand=True
                ),
                ft.Container(
                    content=ft.Text(
                        receita.get('categoria_nome', 'Geral').upper(),
                        size=12,
                        color=self.theme['on_primary']
                    ),
                    padding=ft.padding.symmetric(horizontal=8, vertical=3),
                    bgcolor=self.theme['secondary'],
                    border_radius=20
                )
            ],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN
        )

    def _criar_detalhes(self, receita: Dict) -> ft.Column:
        """Seção de detalhes com ícones e layout organizado"""
        tempo = str(timedelta(minutes=receita.get('tempo_preparo', 0)))
        rendimento = receita.get('rendimento', 0)
        unidade_rendimento = receita.get('unidade_medida_simbolo', 'porções')
        custo = receita.get('custo_estimado', 0)
        descricao = receita.get('descricao', 'Sem descrição')
        dificuldade = receita.get('dificuldade', 'médio').capitalize()

        detalhes = [
            self._criar_item_detalhe(
                ft.Icons.TIMER,
                f"Tempo: {tempo}",
                self.theme['accent']
            ),
            self._criar_item_detalhe(
                ft.Icons.PIE_CHART_OUTLINE,
                f"Rendimento: {rendimento} {unidade_rendimento}",
                self.theme['secondary']
            ),
            self._criar_item_detalhe(
                ft.Icons.ATTACH_MONEY,
                f"Custo estimado: R$ {custo:.2f}" if custo else "Custo não calculado",
                ft.Colors.GREEN_600
            ),
            self._criar_item_detalhe(
                ft.Icons.STAR,
                f"Dificuldade: {dificuldade}",
                ft.Colors.AMBER_500
            ),
            ft.Container(
                content=ft.Text(
                    descricao,
                    size=14,
                    color=self.theme['text'],
                    text_align=ft.TextAlign.JUSTIFY
                ),
                padding=ft.padding.only(top=8, left=30)
            )
        ]

        return ft.Column(controls=detalhes, spacing=6)

    def _criar_item_detalhe(self, icon: str, texto: str, cor: str) -> ft.Row:
        """Cria um item de detalhe padronizado"""
        return ft.Row(
            controls=[
                ft.Icon(icon, size=18, color=cor),
                ft.Text(texto, size=14, color=self.theme['text'])
            ],
            spacing=10
        )

    def _criar_secao(self, titulo: str, conteudo: str, **kwargs) -> ft.Column:
        """Cria uma seção padronizada com título e conteúdo"""
        return ft.Column(
            controls=[
                ft.Text(
                    titulo,
                    size=14,
                    weight=ft.FontWeight.BOLD,
                    color=self.theme['primary']
                ),
                ft.Text(
                    conteudo,
                    size=13,
                    color=self.theme['text'],
                    **kwargs
                )
            ],
            spacing=4
        )

    def _criar_chips_ingredientes(self, ingredientes: List[str]) -> ft.Column:
        """Cria chips de ingredientes com layout moderno"""
        if not ingredientes:
            return ft.Column([ft.Text("Nenhum ingrediente informado", italic=True)])
        
        return ft.Column(
            controls=[
                ft.Text("🍴 Ingredientes:", size=14, weight=ft.FontWeight.BOLD),
                ft.Row(
                    controls=[self._criar_chip(i) for i in ingredientes],
                    wrap=True,
                    spacing=8,
                    run_spacing=8,
                    width=400
                )
            ],
            spacing=8
        )

    def _criar_chip(self, ingrediente: str) -> ft.Chip:
        """Cria um chip básico para ingrediente"""
        return ft.Chip(
            label=ft.Text(ingrediente.capitalize()),
            bgcolor=ft.Colors.GREY_100,
            selected_color=self.theme['primary'],
            on_select=lambda e: self._handle_chip_select(e, ingrediente)
        )

    def _criar_botoes_acao(self, receita_id: int) -> ft.Row:
        """Cria botões de ação para a receita"""
        return ft.Row(
            controls=[
                ft.IconButton(
                    icon=ft.Icons.FAVORITE_BORDER,
                    selected_icon=ft.Icons.FAVORITE,
                    icon_color=self.theme['primary'],
                    on_click=lambda e: self._handle_favorito(e, receita_id)
                ),
                ft.IconButton(
                    icon=ft.Icons.SHARE,
                    icon_color=self.theme['primary'],
                    on_click=lambda e: self._handle_compartilhar(e, receita_id)
                ),
                ft.IconButton(
                    icon=ft.Icons.PRINT,
                    icon_color=self.theme['primary'],
                    on_click=lambda e: self._handle_imprimir(e, receita_id)
                ),
                ft.Container(expand=True),
                ft.FilledButton(
                    text="Ver Detalhes",
                    icon=ft.Icons.CHEVRON_RIGHT,
                    on_click=lambda e: self._handle_detalhes(e, receita_id),
                    style=ft.ButtonStyle(
                        bgcolor=self.theme['primary'],
                        color=self.theme['on_primary']
                    )
                )
            ],
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.CENTER
        )

    def _handle_hover(self, e: ft.HoverEvent):
        """Efeito hover no container"""
        e.control.bgcolor = self.theme['background'] if e.data == "true" else self.theme['surface']
        e.control.update()

    def _handle_clique_bloco(self, e: ft.ControlEvent, receita_id: int):
        """Clique no bloco da receita"""
        self.log.info(f"Receita clicada - ID: {receita_id}")

    def _handle_favorito(self, e: ft.ControlEvent, receita_id: int):
        """Adiciona/remove dos favoritos"""
        e.control.selected = not e.control.selected
        e.control.update()
        action = "favoritada" if e.control.selected else "desfavoritada"
        self.log.info(f"Receita ID {receita_id} {action}")

    def _handle_compartilhar(self, e: ft.ControlEvent, receita_id: int):
        """Compartilha a receita"""
        self.log.info(f"Compartilhando receita ID {receita_id}")

    def _handle_imprimir(self, e: ft.ControlEvent, receita_id: int):
        """Ação de impressão"""
        self.log.info(f"Preparando para imprimir receita ID {receita_id}")

    def _handle_detalhes(self, e: ft.ControlEvent, receita_id: int):
        """Exibe detalhes da receita"""
        self.log.info(f"Exibindo detalhes da receita ID {receita_id}")

    def _handle_chip_select(self, e: ft.ControlEvent, ingrediente: str):
        """Seleciona/deseleciona chip de ingrediente"""
        self.log.info(f"Ingrediente selecionado: {ingrediente}")