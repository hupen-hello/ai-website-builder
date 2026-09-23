import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type SmtpTransportInput = {
  host: string;
  port: number;
  secure?: boolean;
  username: string;
  password: string;
};

/**
 * Build nodemailer options with real encryption:
 * - 465 → immediate TLS (`secure: true`)
 * - 587 → STARTTLS (`secure: false` + `requireTLS: true`)
 * - other ports → honor checkbox, still prefer TLS upgrade when not implicit SSL
 */
export function buildSmtpTransportOptions(
  input: SmtpTransportInput,
): SMTPTransport.Options {
  const port = Math.floor(input.port);
  const secure =
    port === 465 ? true : port === 587 ? false : Boolean(input.secure);

  return {
    host: input.host,
    port,
    secure,
    requireTLS: !secure,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    auth: {
      user: input.username,
      pass: input.password,
    },
  };
}

export function describeSmtpEncryption(port: number, secureFlag: boolean) {
  if (port === 465 || secureFlag) {
    return {
      encrypted: true,
      mode: 'SSL/TLS',
      detail: 'Connection uses TLS from the start (port 465).',
    };
  }
  if (port === 587) {
    return {
      encrypted: true,
      mode: 'STARTTLS',
      detail: 'Connection upgrades to TLS via STARTTLS (port 587).',
    };
  }
  return {
    encrypted: !secureFlag ? true : Boolean(secureFlag),
    mode: secureFlag ? 'SSL/TLS' : 'STARTTLS',
    detail: secureFlag
      ? 'Connection uses TLS from the start.'
      : 'Connection upgrades to TLS via STARTTLS.',
  };
}

/** Normalize stored `secure` so UI matches how transport actually connects. */
export function normalizeSmtpSecure(port: number, secure?: boolean) {
  if (port === 465) return true;
  if (port === 587) return false;
  return Boolean(secure);
}
