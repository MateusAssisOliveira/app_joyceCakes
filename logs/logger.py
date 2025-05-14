import logging
import os
import inspect
from datetime import datetime

class Logger:
    def __init__(self, nome_arquivo='app.log', nome_logger='meu_logger'):
        os.makedirs('logs', exist_ok=True)

        data_str = datetime.now().strftime('%Y-%m-%d')
        caminho_log = os.path.join('logs', f'{data_str}_{nome_arquivo}')

        self.logger = logging.getLogger(nome_logger)
        self.logger.setLevel(logging.DEBUG)

        if not self.logger.handlers:
            file_handler = logging.FileHandler(caminho_log)
            file_handler.setLevel(logging.DEBUG)

            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)

            # Personaliza o formato para incluir nome da função e classe
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s [%(funcName)s | %(name)s]')
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)

            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)

    def _log(self, level, msg):
        # Captura a stack e extrai nome da classe e função
        frame = inspect.currentframe().f_back.f_back
        func_name = frame.f_code.co_name
        cls_name = frame.f_locals.get('self', None).__class__.__name__ if 'self' in frame.f_locals else ''
        mensagem = f'[{cls_name}.{func_name}] {msg}'

        if level == 'debug':
            self.logger.debug(mensagem)
        elif level == 'info':
            self.logger.info(mensagem)
        elif level == 'warning':
            self.logger.warning(mensagem)
        elif level == 'error':
            self.logger.error(mensagem)
        elif level == 'critical':
            self.logger.critical(mensagem)

    def debug(self, msg):
        self._log('debug', msg)

    def info(self, msg):
        self._log('info', msg)

    def warning(self, msg):
        self._log('warning', msg)

    def error(self, msg):
        self._log('error', msg)

    def critical(self, msg):
        self._log('critical', msg)
