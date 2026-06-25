'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { useUIStore } from '@/stores';
import { useAuth } from '@/features/auth';
import { useAboutModal } from '@/features/about';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import ClassroomPageModal from '@/features/classrooms/components/modals/ClassroomPageModal';
import SettingsSidebar from '@/features/student/components/SettingsSidebar';
import AppShell from '@/shared/layout/AppShell';
import AppSidebar from '@/shared/layout/AppSidebar';
import TeacherHomePanel from './TeacherHomePanel';
import TeacherIntroModal from './TeacherIntroModal';

type TeacherPageClientProps = {
	teacherName?: string;
};

function SidebarItem({
	label,
	icon,
	isCollapsed,
	isActive = false,
	isDanger = false,
	onClick,
}: {
	label: string;
	icon: React.ReactNode;
	isCollapsed: boolean;
	isActive?: boolean;
	isDanger?: boolean;
	onClick?: () => void;
}) {
	const activeStyles = isActive
		? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
		: '';
	const dangerStyles = isDanger
		? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
		: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${
				isCollapsed ? 'justify-center' : 'gap-2'
			} ${isActive ? activeStyles : dangerStyles}`}
			title={label}
		>
			<span className="h-4 w-4 shrink-0">{icon}</span>
			<span className={isCollapsed ? 'hidden' : ''}>{label}</span>
		</button>
	);
}

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
						src={theme === 'dark' ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png'}
						alt="AtenaAI"
						width={32}
						height={32}
						className="mr-2"
						style={{ width: 'auto', height: 'auto' }}
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

				<button
					onClick={isAboutOpen ? closeAbout : openAbout}
					className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 md:block"
					type="button"
				>
					{isAboutOpen ? 'Fechar' : 'Sobre'}
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
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10" />
							</svg>
						}
					/>
					<SidebarItem
						label="Turma"
						isCollapsed={isCollapsed}
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
							</svg>
						}
					/>
					<SidebarItem
						label="Turmas e Atividades"
						isCollapsed={isCollapsed}
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M21 12v7a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h11" />
							</svg>
						}
					/>
					<SidebarItem
						label="Relatorios"
						isCollapsed={isCollapsed}
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-3M5 20h14" />
							</svg>
						}
					/>
				</div>
			)}
			footer={({ isCollapsed }) => (
				<div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-700">
					<SidebarItem
						label="Configuracoes"
						isCollapsed={isCollapsed}
						onClick={() => setIsSettingsOpen(true)}
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						}
					/>
					<SidebarItem
						label={isAboutOpen ? 'Fechar' : 'Sobre'}
						isCollapsed={isCollapsed}
						onClick={isAboutOpen ? closeAbout : openAbout}
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
					/>
					<SidebarItem
						label="Sair"
						isCollapsed={isCollapsed}
						onClick={handleLogout}
						isDanger
						icon={
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
							</svg>
						}
					/>
				</div>
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
