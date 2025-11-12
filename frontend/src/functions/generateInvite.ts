import { Dispatch, SetStateAction } from "react";
import api from "../lib/api";

export type GenerateInviteDeps = {
  setItems: Dispatch<SetStateAction<any[]>>;
  onInviteGenerated?: (token: string) => void;
  alertFn?: (msg: string) => void;
  windowObj?: Window;
  baseUrl?: string;
};

/**
 * Gera um convite para a intenção e aplica efeitos colaterais:
 * - dispara callback `onInviteGenerated` com o token
 * - exibe alerta com link completo
 * - atualiza localmente `convite_gerado` para desabilitar o botão
 */
export async function generateInviteAction(id: number, deps: GenerateInviteDeps): Promise<void> {
  const { setItems, onInviteGenerated, alertFn, windowObj, baseUrl } = deps;

  try {
    const res = await api.post<{ token: string }>(`/convites/${id}/gerar`);
    const token = (res.data as any)?.token;
    if (!token) return;

    onInviteGenerated?.(token);

    let origin: string;
    if (windowObj === undefined) {
      origin = baseUrl || process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
    } else {
      origin = windowObj.location.origin;
    }

    const link = `${origin}/register?token=${token}`;
    (alertFn ?? alert)(`Convite gerado: ${link}`);

    setItems((cur: any[]) => cur.map((i) => (i?.id === id ? { ...i, convite_gerado: true } : i)));
  } catch (error_: any) {
    (alertFn ?? alert)(error_?.response?.data?.message || "Não foi possível gerar convite");
    // eslint-disable-next-line no-console
    console.error(error_);
  }
}