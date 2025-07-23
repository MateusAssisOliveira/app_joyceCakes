# retornos.py

class Retorno:
    @staticmethod
    def sucesso(mensagem="Operação realizada com sucesso", dados=None):
        return {
            "ok": True,
            "mensagem": mensagem,
            "status": 200,
            "dados": dados
        }

    @staticmethod
    def erro(mensagem="Erro interno do servidor", dados=None):
        return {
            "ok": False,
            "mensagem": mensagem,
            "status": 500,
            "dados": dados
        }

    @staticmethod
    def nao_encontrado(mensagem="Recurso não encontrado"):
        return {
            "ok": False,
            "mensagem": mensagem,
            "status": 404,
            "dados": None
        }

    @staticmethod
    def dados_invalidos(mensagem="Dados inválidos"):
        return {
            "ok": False,
            "mensagem": mensagem,
            "status": 400,
            "dados": None
        }

    @staticmethod
    def nao_autorizado(mensagem="Usuário não autorizado"):
        return {
            "ok": False,
            "mensagem": mensagem,
            "status": 401,
            "dados": None
        }
    
    @staticmethod
    def paginado(itens, pagina, por_pagina, total_registros, mensagem="Dados paginados retornados com sucesso"):
        total_paginas = max(1, (total_registros + por_pagina - 1) // por_pagina)
        return Retorno.sucesso(
            mensagem,
            dados={
                "itens": itens,
                "pagina": pagina,
                "por_pagina": por_pagina,
                "total_registros": total_registros,
                "total_paginas": total_paginas
            }
        )