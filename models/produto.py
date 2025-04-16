import logging
from dataclasses import dataclass, field

# Configuração básica do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class Produto:
    _id: int = field(default=None, repr=False)
    _nome: str = field(default='', repr=False)
    _descricao: str = field(default='', repr=False)
    _preco: float = field(default=0.0, repr=False)
    _quantidade: int = field(default=0, repr=False)
    _tipo: str = field(default='unidade', repr=False)

    TIPOS_VALIDOS = {'unidade', 'kg', 'litro', 'pacote', 'caixa'}

    def __post_init__(self):
        # Chamamos os setters para forçar validação ao criar
        logger.debug(f"Inicializando Produto com: id={self._id}, nome={self._nome}, descricao={self._descricao}, "
                     f"preco={self._preco}, quantidade={self._quantidade}, tipo={self._tipo}")
        if self._id is not None:
            self.id = self._id  # Usando o setter id
        self.nome = self._nome  # Usando o setter nome
        self.descricao = self._descricao  # Usando o setter descricao
        self.preco = self._preco  # Usando o setter preco
        self.quantidade = self._quantidade  # Usando o setter quantidade
        self.tipo = self._tipo  # Usando o setter tipo

    # ID
    @property
    def id(self):
        return self._id

    @id.setter
    def id(self, valor):
        logger.debug(f"Setando ID com valor: {valor}")
        if valor is not None and not isinstance(valor, int):
            logger.error("ID deve ser um inteiro ou None.")
            raise TypeError("ID deve ser um inteiro ou None.")
        self._id = valor
        logger.info(f"ID setado com sucesso: {self._id}")

    # Nome
    @property
    def nome(self):
        return self._nome

    @nome.setter
    def nome(self, valor):
        logger.debug(f"Setando nome com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Nome deve ser uma string.")
            raise TypeError("Nome deve ser uma string.")
        if not valor.strip():
            logger.error("Nome não pode ser vazio.")
            raise ValueError("Nome não pode ser vazio.")
        self._nome = valor.strip()
        logger.info(f"Nome setado com sucesso: {self._nome}")

    # Descrição
    @property
    def descricao(self):
        return self._descricao

    @descricao.setter
    def descricao(self, valor):
        logger.debug(f"Setando descrição com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Descrição deve ser uma string.")
            raise TypeError("Descrição deve ser uma string.")
        self._descricao = valor.strip()
        logger.info(f"Descrição setada com sucesso: {self._descricao}")

    # Preço
    @property
    def preco(self):
        return self._preco

    @preco.setter
    def preco(self, valor):
        logger.debug(f"Setando preço com valor: {valor}")
        if not isinstance(valor, (int, float)):
            logger.error("Preço deve ser um número.")
            raise TypeError("Preço deve ser um número.")
        if valor < 0:
            logger.error("Preço não pode ser negativo.")
            raise ValueError("Preço não pode ser negativo.")
        self._preco = float(valor)
        logger.info(f"Preço setado com sucesso: {self._preco}")

    # Quantidade
    @property
    def quantidade(self):
        return self._quantidade

    @quantidade.setter
    def quantidade(self, valor):
        logger.debug(f"Setando quantidade com valor: {valor}")
        if not isinstance(valor, int):
            logger.error("Quantidade deve ser um inteiro.")
            raise TypeError("Quantidade deve ser um inteiro.")
        if valor < 0:
            logger.error("Quantidade não pode ser negativa.")
            raise ValueError("Quantidade não pode ser negativa.")
        self._quantidade = valor
        logger.info(f"Quantidade setada com sucesso: {self._quantidade}")

    # Tipo
    @property
    def tipo(self):
        return self._tipo

    @tipo.setter
    def tipo(self, valor):
        logger.debug(f"Setando tipo com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Tipo deve ser uma string.")
            raise TypeError("Tipo deve ser uma string.")
        if valor.lower() not in self.TIPOS_VALIDOS:
            logger.error(f"Tipo inválido. Tipos válidos: {', '.join(self.TIPOS_VALIDOS)}.")
            raise ValueError(f"Tipo inválido. Tipos válidos: {', '.join(self.TIPOS_VALIDOS)}.")
        self._tipo = valor.lower()
        logger.info(f"Tipo setado com sucesso: {self._tipo}")
