import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tic-tac-toe-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // Write all logs with level 'info' and below to logs/combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write all errors to logs/error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

export default logger;