import logging

class ConfigurarLogger:

    @staticmethod
    def configurar(nome_logger='app_logger', log_em_arquivo=False):
        logger = logging.getLogger(nome_logger)
        logger.setLevel(logging.DEBUG)

        if not logger.handlers:
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - [%(funcName)s] - %(message)s')

            # Console
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

            # Arquivo (se ativado)
            if log_em_arquivo:
                file_handler = logging.FileHandler('app.log', encoding='utf-8')
                file_handler.setFormatter(formatter)
                logger.addHandler(file_handler)

        return logger
