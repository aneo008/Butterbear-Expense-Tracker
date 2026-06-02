/// <reference lib="dom" />
// Cross-platform file I/O in a SINGLE file (branching on Platform.OS) to avoid
// platform-resolution ambiguity. Native uses expo-file-system + sharing +
// document-picker; web uses a Blob download and a hidden <input type=file>.
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export async function writeAndShare(
  filename: string,
  content: string,
  mimeType: string
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create({ overwrite: true, intermediates: true });
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: 'Save or send your Butter data',
    UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text',
  });
}

export function pickAndReadText(
  types: string[] = ['application/json']
): Promise<{ name: string; text: string } | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = [...types, '.json', '.csv'].join(',');
      input.style.display = 'none';
      document.body.appendChild(input);

      let settled = false;
      const finish = (value: { name: string; text: string } | null) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('focus', onFocus);
        input.remove();
        resolve(value);
      };
      const onFocus = () => setTimeout(() => finish(null), 500);

      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return finish(null);
        try {
          const text = await file.text();
          if (!settled) {
            settled = true;
            window.removeEventListener('focus', onFocus);
            input.remove();
            resolve({ name: file.name, text });
          }
        } catch (e) {
          if (!settled) {
            settled = true;
            window.removeEventListener('focus', onFocus);
            input.remove();
            reject(e);
          }
        }
      };

      window.addEventListener('focus', onFocus);
      input.click();
    });
  }

  return (async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: types,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets || res.assets.length === 0) return null;
    const asset = res.assets[0];
    const file = new File(asset.uri);
    const text = await file.text();
    return { name: asset.name ?? 'file', text };
  })();
}
