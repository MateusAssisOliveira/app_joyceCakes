# logs/logger.py
import logging
import os
import inspect
from datetime import datetime

class Logger:
    _instance = None  # 🔒 Singleton

    def __new__(cls, nome_arquivo='app.log', nome_logger='meu_logger'):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance._init(nome_arquivo, nome_logger)
        return cls._instance

    def _init(self, nome_arquivo, nome_logger):
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

            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s [%(funcName)s | %(name)s]')
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)

            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)

    def _log(self, level, msg):
        frame = inspect.currentframe().f_back.f_back
        func_name = frame.f_code.co_name
        cls_name = frame.f_locals.get('self', None).__class__.__name__ if 'self' in frame.f_locals else ''
        mensagem = f'[{cls_name}.{func_name}] {msg}'

        getattr(self.logger, level)(mensagem)

    def debug(self, msg): self._log('debug', msg)
    def info(self, msg): self._log('info', msg)
    def warning(self, msg): self._log('warning', msg)
    def error(self, msg): self._log('error', msg)
    def critical(self, msg): self._log('critical', msg)
