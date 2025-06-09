import flet as ft
from logs.logger import Logger

class RodapePaginacao():
    def __init__(self, total_paginas=None, ao_mudar_pagina=None):
        super().__init__()
        self.log = Logger()
        self.total_paginas = total_paginas
        self.pagina_atual = 1
        self.ao_mudar_pagina = ao_mudar_pagina

        self.log.info("RodapePaginacao inicializado.")
        self.log.debug(f"Total de páginas definido: {self.total_paginas}")

    def construir(self):
        
        self.log.debug("Construindo controles do rodapé de paginação.")
        self.btn_anterior = ft.IconButton(
            icon=ft.Icons.ARROW_BACK,
            on_click=self.pagina_anterior,
            disabled=self.pagina_atual == 1
        )
        self.btn_proximo = ft.IconButton(
            icon=ft.Icons.ARROW_FORWARD,
            on_click=self.proxima_pagina,
            disabled=self.pagina_atual == self.total_paginas
        )
        self.texto_pagina = ft.Text(f"Página {self.pagina_atual} de {self.total_paginas}")
        self.log.debug(f"Texto da página: {self.texto_pagina.value}")

        self._row = ft.Container( 
            content = ft.Row(
            controls=[
                self.btn_anterior,
                self.texto_pagina,
                self.btn_proximo
            ],
            alignment=ft.MainAxisAlignment.CENTER,
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=20
            
        ),
        margin=ft.margin.only(top=10, bottom=10),
        alignment=ft.alignment.center
        )
        return self._row


    def pagina_anterior(self, e):
        self.log.debug("Botão 'anterior' clicado.")
        if self.pagina_atual > 1:
            self.pagina_atual -= 1
            self.log.info(f"Indo para a página anterior: {self.pagina_atual}")
            self.atualizar()
        else:
            self.log.debug("Página atual já é a primeira. Nenhuma ação tomada.")

    def proxima_pagina(self, e):
        self.log.debug("Botão 'próximo' clicado.")
        if self.pagina_atual < self.total_paginas:
            self.pagina_atual += 1
            self.log.info(f"Indo para a próxima página: {self.pagina_atual}")
            self.atualizar()
        else:
            self.log.debug("Página atual já é a última. Nenhuma ação tomada.")

    def atualizar(self):
        self.log.debug(f"Atualizando componentes para a página {self.pagina_atual}.")
        self.texto_pagina.value = f"Página {self.pagina_atual} de {self.total_paginas}"
        self.btn_anterior.disabled = self.pagina_atual == 1
        self.btn_proximo.disabled = self.pagina_atual == self.total_paginas

        # Atualiza os widgets individualmente
        self.texto_pagina.update()
        self.btn_anterior.update()
        self.btn_proximo.update()
        
        # Atualiza o container do rodapé para refletir as mudanças
        if hasattr(self, '_row'):
            self._row.update()

        if callable(self.ao_mudar_pagina):
            self.log.debug("Chamando callback ao_mudar_pagina.")
            self.ao_mudar_pagina(self.pagina_atual)
        else:
            self.log.warning("Callback ao_mudar_pagina não é callable ou não foi definido.")

    def build(self):
        self.log.debug("Chamando build() do RodapePaginacao.")
        return self.construir()
