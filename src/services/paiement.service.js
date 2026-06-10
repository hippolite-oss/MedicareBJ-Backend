/**
 * services/paiement.service.js — FedaPay
 */
const axios = require('axios');
const logger = require('../utils/logger');
const {
  FEDAPAY_MODES_MOBILE,
  unwrapFedaPayResource,
  formatTelephoneFedaPay,
  getFedaPayBaseUrl,
  mapStatutFedaPay,
} = require('../utils/fedapay');

let FedaPayWebhook;
try {
  FedaPayWebhook = require('fedapay').Webhook;
} catch {
  FedaPayWebhook = null;
}

const paiementService = {
  _fedapayHeaders() {
    const apiKey = process.env.FEDAPAY_SECRET_KEY;
    if (!apiKey) throw new Error('FEDAPAY_SECRET_KEY non configurée');
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  },

  /**
   * Créer une transaction FedaPay (checkout ou Mobile Money sans redirection)
   */
  async initierFedaPay({
    montant,
    id_paiement,
    email,
    nom,
    prenom,
    telephone,
    description = 'Paiement MediCare BJ',
    modeMobile,
  }) {
    const baseUrl = getFedaPayBaseUrl();
    const headers = this._fedapayHeaders();

    const customer = {
      email,
      firstname: prenom,
      lastname: nom,
    };
    if (telephone) {
      customer.phone_number = formatTelephoneFedaPay(telephone);
    }

    const payload = {
      description,
      amount: Math.round(Number(montant)),
      currency: { iso: 'XOF' },
      callback_url: `${process.env.FEDAPAY_CALLBACK_URL || `${process.env.FRONTEND_URL}/paiement/retour`}?id_paiement=${id_paiement}`,
      custom_metadata: { id_paiement },
      customer,
    };

    try {
      const createRes = await axios.post(`${baseUrl}/transactions`, payload, { headers });
      const transaction = unwrapFedaPayResource(createRes.data);
      const transactionId = transaction.id;

      const tokenRes = await axios.post(
        `${baseUrl}/transactions/${transactionId}/token`,
        {},
        { headers }
      );
      const tokenPayload = tokenRes.data?.token ? tokenRes.data : unwrapFedaPayResource(tokenRes.data);
      const paymentToken = tokenPayload.token;
      const paymentUrl = tokenPayload.url;

      if (modeMobile && telephone && paymentToken) {
        const methode = FEDAPAY_MODES_MOBILE[modeMobile];
        if (!methode) throw new Error(`Mode FedaPay mobile non supporté : ${modeMobile}`);
        await axios.post(
          `${baseUrl}/${methode}`,
          { token: paymentToken, phone_number: customer.phone_number },
          { headers }
        );
        return {
          reference_fedapay: String(transactionId),
          statut: 'en_attente',
          sans_redirection: true,
        };
      }

      return {
        payment_url: paymentUrl,
        payment_token: paymentToken,
        reference_fedapay: String(transactionId),
        statut: 'en_attente',
      };
    } catch (err) {
      const fedapayErr = err.response?.data;
      logger.error('Erreur FedaPay :', fedapayErr || err.message);

      if (process.env.NODE_ENV === 'development' && process.env.FEDAPAY_SIMULATE === 'true') {
        return {
          payment_url: `${process.env.FRONTEND_URL}/paiement/retour?simule=1&id=${id_paiement}`,
          reference_fedapay: id_paiement,
          statut: 'en_attente',
          simule: true,
        };
      }

      const msg = String(fedapayErr?.message || fedapayErr?.error || err.message || '');
      if (err.response?.status === 401 || /authentification/i.test(msg)) {
        throw new Error(
          'Clé API FedaPay invalide. Vérifiez FEDAPAY_SECRET_KEY (sk_sandbox_...) et FEDAPAY_ENVIRONMENT=sandbox dans .env'
        );
      }
      throw new Error(msg || 'Erreur initiation paiement FedaPay');
    }
  },

  async recupererTransactionFedaPay(transactionId) {
    const baseUrl = getFedaPayBaseUrl();
    const res = await axios.get(`${baseUrl}/transactions/${transactionId}`, {
      headers: this._fedapayHeaders(),
    });
    return unwrapFedaPayResource(res.data);
  },

  construireEvenementFedaPay(rawBody, signature) {
    const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('FEDAPAY_WEBHOOK_SECRET absent — parsing JSON sans vérification de signature');
      const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      return typeof body === 'string' ? JSON.parse(body) : body;
    }
    if (!FedaPayWebhook) {
      throw new Error('Package fedapay requis pour la vérification des webhooks');
    }
    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody));
    return FedaPayWebhook.constructEvent(payload, signature, secret);
  },

  mapStatutFedaPay,
};

module.exports = { paiementService };
