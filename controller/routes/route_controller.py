from pages.estoque.estoque_page import EstoquePage
from pages.home.home_page import home_page
from pages.page_404.not_found_page import not_found_page
from pages.receitas.receitas_page import ReceitasPage

class RouteController:
    def __init__(self, page):
        self.page = page
        self.routes = {
            "/": self.home_view,
            "/estoque": self.estoque_view,
            "/receitas": self.receitas_view
        }

    def home_view(self):
        return home_page(self.page)

    def estoque_view(self):
        return EstoquePage(self.page).as_view()
    
    def receitas_view(self):
        return ReceitasPage(self.page).as_view()
    
    def not_found(self):
        return not_found_page(self.page)

    def route_change(self, route):
        view_fn = self.routes.get(route.route, self.not_found)
        self.page.views.clear()
        self.page.views.append(view_fn())
        self.page.update()
