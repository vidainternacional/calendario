// Declaración de tipos para la librería 'qrcode' (dibuja códigos QR en canvas)
declare module 'qrcode' {
  export function toCanvas(
    canvas: HTMLCanvasElement | null,
    text: string,
    options?: {
      width?: number
      margin?: number
      color?: { dark?: string; light?: string }
    }
  ): Promise<HTMLCanvasElement>
}
