import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import AddExpenseSheet from '../../src/components/AddExpenseSheet';
import { useExpenseStore } from '../../src/store/useExpenseStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.55 }}>
      {emoji}
    </Text>
  );
}

function HeaderAddButton() {
  const openAddSheet = useExpenseStore(s => s.openAddSheet);
  return (
    <Text
      onPress={openAddSheet}
      style={{ fontSize: 28, paddingRight: 16, color: '#5A4632', fontWeight: '300' }}
    >
      +
    </Text>
  );
}

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#F5C45E',
          tabBarInactiveTintColor: '#9C8772',
          tabBarStyle: {
            backgroundColor: '#FFFBF2',
            borderTopColor: '#E3C49A44',
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: { backgroundColor: '#FFFBF2' },
          headerShadowVisible: false,
          headerTitleStyle: { color: '#5A4632', fontWeight: '700', fontSize: 18 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            headerTitle: 'Insights',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
            headerRight: () => <HeaderAddButton />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            headerTitle: 'Shop',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🛍️" focused={focused} />,
            headerRight: () => <HeaderAddButton />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: 'Settings',
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          }}
        />
      </Tabs>

      {/* Global add sheet — lives outside Tabs so it overlays any tab */}
      <AddExpenseSheet />
    </>
  );
}
