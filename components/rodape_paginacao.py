import flet as ft
from logs.logger import Logger

class RodapePaginacao:
    def __init__(self, total_paginas=None, ao_mudar_pagina=None):
        self.log = Logger()
        self.total_paginas = total_paginas
        self.pagina_atual = 1
        self.ao_mudar_pagina = ao_mudar_pagina
        
        # Controles da UI
        self.btn_anterior = None
        self.btn_proximo = None
        self.texto_pagina = None
        self.container_rodape = None

        self.set_callback(ao_mudar_pagina)
                
        self.log.info("RodapePaginacao inicializado")

    def set_callback(self, callback):
        """Define ou altera o callback de mudança de página"""
        if callback is not None and not callable(callback):
            raise ValueError("Callback deve ser uma função ou None")
        self.ao_mudar_pagina = callback
        self.log.debug(f"\n\nCallback definido: {callback}")
        
    def construir(self):
        """Cria e retorna o componente de rodapé de paginação"""
        self._criar_botoes()
        self._criar_texto_pagina()
        
        self.container_rodape = ft.Container(
            content=ft.Row(
                controls=[
                    self.btn_anterior,
                    self.texto_pagina,
                    self.btn_proximo
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=20
            ),
            margin=ft.margin.only(top=10, bottom=10),
            alignment=ft.alignment.center
        )
        
        return self.container_rodape

    def _criar_botoes(self):
        """Cria os botões de navegação"""
        self.btn_anterior = ft.IconButton(
            icon=ft.Icons.ARROW_BACK,
            on_click=self._ir_pagina_anterior,
            disabled=self.pagina_atual == 1
        )
        
        self.btn_proximo = ft.IconButton(
            icon=ft.Icons.ARROW_FORWARD,
            on_click=self._ir_proxima_pagina,
            disabled=self.pagina_atual == self.total_paginas
        )

    def _criar_texto_pagina(self):
        """Cria o texto que exibe a página atual"""
        self.texto_pagina = ft.Text(f"Página {self.pagina_atual} de {self.total_paginas}")

    def _ir_pagina_anterior(self, e):
        """Navega para a página anterior"""
        if self.pagina_atual <= 1:
            return
            
        self.pagina_atual -= 1
        self._atualizar_pagina()

    def _ir_proxima_pagina(self, e):
        """Navega para a próxima página"""
        if self.pagina_atual >= self.total_paginas:
            return
            
        self.pagina_atual += 1
        self._atualizar_pagina()

    def _atualizar_pagina(self):
        """Atualiza a UI e chama o callback"""
        self._atualizar_ui()
        if callable(self.ao_mudar_pagina):
            self.ao_mudar_pagina(self.pagina_atual)

    def _atualizar_ui(self):
        """Atualiza os componentes visuais"""
        self.texto_pagina.value = f"Página {self.pagina_atual} de {self.total_paginas}"
        self.btn_anterior.disabled = self.pagina_atual == 1
        self.btn_proximo.disabled = self.pagina_atual == self.total_paginas
        
        # Atualiza os componentes
        self.texto_pagina.update()
        self.btn_anterior.update()
        self.btn_proximo.update()
        
        if self.container_rodape:
            self.container_rodape.update()

    def build(self):
        """Método compatível com Flet para construção do componente"""
        return self.construir()