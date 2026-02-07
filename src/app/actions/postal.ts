"use server";

export type PostalRequestInput = {
  name: string;
  phone: string;
  comment?: string;
};

export type PostalRequestResult = {
  success: boolean;
  error?: string;
};

/**
 * Server Action для обработки заявки на почтовое отправление
 * TODO: В будущем подключить отправку в Telegram
 */
export async function submitPostalRequest(
  input: PostalRequestInput
): Promise<PostalRequestResult> {
  try {
    // Валидация
    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: "Пожалуйста, укажите ваше имя" };
    }

    if (!input.phone || input.phone.trim().length < 10) {
      return { success: false, error: "Пожалуйста, укажите корректный телефон" };
    }

    // Логирование заявки (в будущем заменить на отправку в Telegram)
    console.log("=== Новая заявка на почтовое отправление ===");
    console.log("Имя:", input.name.trim());
    console.log("Телефон:", input.phone.trim());
    if (input.comment) {
      console.log("Комментарий:", input.comment.trim());
    }
    console.log("Время:", new Date().toLocaleString("ru-RU"));
    console.log("============================================");

    return { success: true };
  } catch (error) {
    console.error("Ошибка при обработке заявки:", error);
    return { success: false, error: "Произошла ошибка. Попробуйте позже." };
  }
}
