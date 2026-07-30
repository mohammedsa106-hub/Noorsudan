import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { supabase } from '@/lib/client';
import { useAuth } from '@/context/AuthContext';
import { useAskNour } from '@/context/AskNourContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SUPABASE_URL, SUPABASE_ANON_KEY, FALLBACK_CATEGORIES, QUICK_PROMPTS, type ChatMsg, type Category, type RootStackParamList,
} from '@/lib/supabase';

export function AskNourModal() {
  const { open, prefill, closeAsk } = useAskNour();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setCategories(data as Category[]);
    });
  }, []);

  const askNour = useCallback(async (question: string) => {
    if (!question.trim()) return;
    const userMsg: ChatMsg = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-nour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: question, history: messages }),
      });
      const data = await res.json();
      setThinking(false);

      const reply = data.reply || 'عذراً، لم أتمكن من فهم طلبك. حاول مرة أخرى.';
      const cat = data.category ? (categories.find((c) => c.slug === data.category.slug) || data.category) : null;
      const suggestions = data.suggestions || [];

      // Stream word by word
      const words = reply.split(' ');
      let streamed = '';
      setMessages((prev) => [...prev, { role: 'assistant', text: '', category: cat, suggestions }]);
      for (let i = 0; i < words.length; i++) {
        streamed += (i > 0 ? ' ' : '') + words[i];
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], text: streamed };
          return copy;
        });
        await new Promise((r) => setTimeout(r, 35));
      }
    } catch {
      setThinking(false);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    }
  }, [messages, categories]);

  useEffect(() => {
    if (open && prefill) {
      askNour(prefill);
    }
  }, [open, prefill, askNour]);

  const handleClose = () => {
    closeAsk();
    setMessages([]);
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="Sparkles" size={20} color={colors.gold400} />
              </View>
              <View>
                <Text style={styles.headerTitle}>اسأل نور</Text>
                <Text style={styles.headerSub}>مساعدك الذكي</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Icon name="X" size={22} color={colors.gold200} />
            </Pressable>
          </View>

          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeIcon}>
                <Icon name="Sparkles" size={48} color={colors.gold400} />
              </View>
              <Text style={styles.welcomeTitle}>مرحبا! أنا نور</Text>
              <Text style={styles.welcomeText}>كيف يمكنني مساعدتك اليوم؟ اختر من الأسئلة الشائعة أو اكتب سؤالك</Text>
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((q) => (
                  <Pressable key={q} style={styles.chip} onPress={() => askNour(q)}>
                    <Text style={styles.chipText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <View style={[styles.msg, item.role === 'user' ? styles.msgUser : styles.msgAssistant]}>
                  <Text style={[styles.msgText, item.role === 'user' ? styles.msgUserText : styles.msgAssistantText]}>
                    {item.text}
                  </Text>
                  {item.category && (
                    <Pressable
                      style={styles.catBtn}
                      onPress={() => { handleClose(); nav.navigate('Category' as any, { slug: item.category!.slug, name: item.category!.name }); }}
                    >
                      <Icon name={item.category.icon || 'Folder'} size={14} color={colors.black} />
                      <Text style={styles.catBtnText}>اذهب إلى: {item.category.name}</Text>
                    </Pressable>
                  )}
                  {item.suggestions && item.suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                      {item.suggestions.map((s: string) => (
                        <Pressable key={s} style={styles.suggestionChip} onPress={() => askNour(s)}>
                          <Text style={styles.suggestionText}>{s}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {thinking && (
            <View style={styles.thinking}>
              <Text style={styles.thinkingText}>نور يفكر</Text>
              <View style={styles.dots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="اكتب سؤالك..."
              placeholderTextColor={colors.ink500}
              multiline
              textAlign="right"
            />
            <Pressable style={styles.sendBtn} onPress={() => askNour(input)} disabled={!input.trim()}>
              <Icon name="Send" size={18} color={colors.black} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,160,23,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.gold100 },
  headerSub: { fontSize: fontSizes.xs, color: colors.ink500 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  welcomeIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,160,23,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.gold100, marginBottom: 8 },
  welcomeText: { fontSize: fontSizes.md, color: colors.ink400, textAlign: 'center', marginBottom: 24 },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: fontSizes.sm, color: colors.gold200 },
  msgList: { padding: 16, gap: 12 },
  msg: { maxWidth: '85%', padding: 14, borderRadius: radii.md },
  msgUser: { alignSelf: 'flex-end', backgroundColor: colors.gold400 },
  msgAssistant: { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: fontSizes.md, lineHeight: 22 },
  msgUserText: { color: colors.black },
  msgAssistantText: { color: colors.ink100 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: colors.gold400, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.sm, alignSelf: 'flex-start' },
  catBtnText: { fontSize: fontSizes.sm, color: colors.black, fontWeight: '700' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestionChip: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 6 },
  suggestionText: { fontSize: fontSizes.xs, color: colors.gold200 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  thinkingText: { fontSize: fontSizes.sm, color: colors.ink500 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold400 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: fontSizes.md, color: colors.ink100, maxHeight: 100, textAlign: 'right' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold400, alignItems: 'center', justifyContent: 'center' },
});
