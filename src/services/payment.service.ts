import { logger } from "../utils/logger";

export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  orderNumber: string;
}

export class PaymentService {
  private readonly SIMULATION_FAILURE_RATE = 0.1;

  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    const { orderNumber, amount } = paymentRequest;

    logger.info(`Processing payment for order ${orderNumber}, amount: ${amount}`);

    await this.simulateProcessingDelay();

    const shouldFail = Math.random() < this.SIMULATION_FAILURE_RATE;

    if (shouldFail) {
      logger.warn(`Payment simulation failed for order ${orderNumber}`);

      return {
        success: false,
        message: "Payment declined: Insufficient funds",
        orderNumber,
      };
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`Payment successful for order ${orderNumber}, transaction ID: ${transactionId}`);

    return {
      success: true,
      message: "Payment successful",
      transactionId,
      orderNumber,
    };
  }

  async processPaymentWithSuccess(paymentRequest: PaymentRequest, forceSuccess: boolean = false): Promise<PaymentResult> {
    const { orderNumber } = paymentRequest;

    logger.info(`Processing payment for order ${orderNumber} (forceSuccess: ${forceSuccess})`);

    await this.simulateProcessingDelay();

    if (forceSuccess) {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info(`Payment forced success for order ${orderNumber}, transaction ID: ${transactionId}`);

      return {
        success: true,
        message: "Payment successful",
        transactionId,
        orderNumber,
      };
    }

    return this.processPayment(paymentRequest);
  }

  private async simulateProcessingDelay(): Promise<void> {
    const delay = Math.random() * 500 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  validatePaymentDetails(paymentRequest: PaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentRequest.orderNumber) {
      errors.push("Order number is required");
    }

    if (!paymentRequest.amount || paymentRequest.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }

    if (!paymentRequest.paymentMethod) {
      errors.push("Payment method is required");
    }

    if (paymentRequest.paymentMethod === "card") {
      if (!paymentRequest.cardNumber) {
        errors.push("Card number is required");
      } else if (!this.isValidCardNumber(paymentRequest.cardNumber)) {
        errors.push("Invalid card number");
      }

      if (!paymentRequest.expiryDate) {
        errors.push("Expiry date is required");
      } else if (!this.isValidExpiryDate(paymentRequest.expiryDate)) {
        errors.push("Invalid or expired card");
      }

      if (!paymentRequest.cvv) {
        errors.push("CVV is required");
      } else if (paymentRequest.cvv.length < 3 || paymentRequest.cvv.length > 4) {
        errors.push("Invalid CVV");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, "").replace(/-/g, "");

    return /^\d{13,19}$/.test(cleaned);
  }

  private isValidExpiryDate(expiryDate: string): boolean {
    const [month, year] = expiryDate.split("/").map((val) => parseInt(val, 10));

    if (!month || !year || month < 1 || month > 12) {
      return false;
    }

    const now = new Date();
    const expiry = new Date(2000 + year, month - 1);

    return expiry > now;
  }

  refundPayment(transactionId: string, amount: number): PaymentResult {
    logger.info(`Refunding payment ${transactionId}, amount: ${amount}`);

    return {
      success: true,
      message: "Refund processed successfully",
      transactionId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: "",
    };
  }
}
