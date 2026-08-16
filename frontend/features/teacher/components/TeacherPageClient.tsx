'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { getLogoUrl } from '@/lib/logo';
import { useUIStore } from '@/stores';
import { useAuth } from '@/features/auth';
import { useAboutModal } from '@/features/about';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import ClassroomPageModal from '@/features/classrooms/components/modals/ClassroomPageModal';
import SettingsSidebar from '@/features/student/components/SettingsSidebar';
import AppShell from '@/shared/layout/AppShell';
import AppSidebar from '@/shared/layout/AppSidebar';
import SidebarItem from '@/shared/layout/SidebarItem';
import SidebarFooter from '@/shared/layout/SidebarFooter';
import TeacherHomePanel from './TeacherHomePanel';
import TeacherIntroModal from './TeacherIntroModal';

type TeacherPageClientProps = {
	teacherName?: string;
};

export default function TeacherPageClient({ teacherName }: TeacherPageClientProps) {
	const { theme, toggleTheme } = useThemeMode();
	const router = useRouter();
	const { user, logout } = useAuth();
	const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
	const { isOpen: isClassroomOpen, classroom, closeClassroom } = useClassroomView();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar } = useUIStore();

	const resolvedTeacherName =
		teacherName || user?.full_name || user?.name || 'Professor';
	const userInitial = useMemo(
		() => resolvedTeacherName.trim().charAt(0).toUpperCase() || 'P',
		[resolvedTeacherName]
	);

	// Fechar sidebar mobile quando sala abrir
	useEffect(() => {
		if (isClassroomOpen && isMobileSidebarOpen) {
			closeMobileSidebar();
		}
	}, [isClassroomOpen, isMobileSidebarOpen, closeMobileSidebar]);

	const handleLogout = async () => {
		try {
			await logout();
			router.push('/');
		} catch (error) {
			console.error('[TeacherPageClient] Logout error:', error);
			router.push('/');
		}
	};

	const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (isAboutOpen) {
			event.preventDefault();
			closeAbout();
		}
	};

	const header = (
		<header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
			<div className="flex items-center">
				<button
					aria-label="Abrir menu lateral"
					className="mr-3 rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
					onClick={openMobileSidebar}
				>
					<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
					</svg>
				</button>

				<Link href="/" onClick={handleBrandClick} className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
<Image
						src={getLogoUrl(theme)}
						alt="AtenaAI"
						width={32}
						height={32}
						className="mr-2 h-8 w-auto object-contain"
					/>
					AtenaAI
				</Link>

				<span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
					Professor
				</span>
			</div>

			<div className="flex items-center gap-3">
				<button
					aria-label="Alternar tema"
					className="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					onClick={toggleTheme}
				>
					{theme === 'dark' ? (
						<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
						</svg>
					) : (
						<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
						</svg>
					)}
				</button>
			</div>
		</header>
	);

	const sidebar = (
		<AppSidebar
			userName={resolvedTeacherName}
			userInitial={userInitial}
			userAvatar={user?.profile_image}
			userRole="Professor"
			isMobileOpen={isMobileSidebarOpen}
			onCloseMobile={closeMobileSidebar}
			content={({ isCollapsed }) => (
				<div className="space-y-2">
					<SidebarItem
						label="Painel"
						isCollapsed={isCollapsed}
						isActive
						icon={
							<svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10" />
							</svg>
						}
					/>
					<SidebarItem
						label="Turma"
						isCollapsed={isCollapsed}
						icon={
							<svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
							</svg>
						}
					/>
					<SidebarItem
						label="Turmas e Atividades"
						isCollapsed={isCollapsed}
						icon={
							<svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M21 12v7a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h11" />
							</svg>
						}
					/>
					<SidebarItem
						label="Relatorios"
						isCollapsed={isCollapsed}
						icon={
							<svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-3M5 20h14" />
							</svg>
						}
					/>
				</div>
			)}
			footer={({ isCollapsed }) => (
				<SidebarFooter
					isCollapsed={isCollapsed}
					onOpenSettings={() => {
						closeMobileSidebar();
						setIsSettingsOpen(true);
					}}
					onLogout={handleLogout}
					aboutLabel={isAboutOpen ? 'Fechar' : 'Sobre'}
					onAboutClick={() => {
						closeMobileSidebar();
						if (isAboutOpen) {
							closeAbout();
						} else {
							openAbout();
						}
					}}
				/>
			)}
		/>
	);

	return (
		<>
			<AppShell
				header={header}
				sidebar={sidebar}
				settingsPanel={<SettingsSidebar open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
				about={
					isClassroomOpen ? (
						<ClassroomPageModal classroom={classroom} onClose={closeClassroom} />
					) : (
						isAboutOpen && <TeacherIntroModal teacherName={resolvedTeacherName} />
					)
				}
			>
				<TeacherHomePanel teacherName={resolvedTeacherName} />
			</AppShell>
		</>
	);
}
