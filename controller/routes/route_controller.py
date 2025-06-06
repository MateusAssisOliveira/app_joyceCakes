from pages.estoque_page import EstoquePage
from pages.home_page import home_page
from pages.not_found_page import not_found_page

class RouteController:
    def __init__(self, page):
        self.page = page
        self.routes = {
            "/": self.home_view,
            "/estoque": self.estoque_view,
        }

    def home_view(self):
        return home_page(self.page)

    def estoque_view(self):
        return EstoquePage(self.page).as_view()
    
    def not_found(self):
        return not_found_page(self.page)

    def route_change(self, route):
        view_fn = self.routes.get(route.route, self.not_found)
        self.page.views.clear()
        self.page.views.append(view_fn())
        self.page.update()
