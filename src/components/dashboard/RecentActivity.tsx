import type { UserModel } from "@/types";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { HeartIcon, UserPlusIcon } from "@heroicons/react/24/solid";

interface Activity {
	id: string; // or number, depending on your data
	description: string;
	date: string; // ISO string or Date
	icon: string; // JSX element for the icon
}

interface RecentActivityProps {
	user: UserModel;
	activities: Activity[];
}

export default function RecentActivity({
	user,
	activities,
}: RecentActivityProps) {
	// Default activities if none provided
	const defaultActivities = [
		{
			id: "0",
			description: "Created your MUMS profile!",
			date: user.createdAt,
			icon: "user-plus",
		},
	];

	const activitiesToDisplay = [...activities, defaultActivities[0]].slice(0, 5);

	// Format relative time
	const formatRelativeTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSeconds < 60) {
			return "less than a minute ago";
		}
		if (diffMinutes < 60) {
			return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
		}
		if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
		}
		if (diffDays < 7) {
			return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
		}
		return date.toLocaleDateString();
	};

	const getIcon = (type: string) => {
		switch (type) {
			case "heart": {
				return <HeartIcon className="h-5 w-5 text-red-400" />;
			}

			case "calendar": {
				return <CalendarIcon className="h-6 w-6 text-blue-400" />;
			}

			case "user-plus": {
				return <UserPlusIcon className="h-5 w-5 text-green-400" />;
			}

			default: {
				return "?";
			}
		}
	};

	return (
		<div className="flow-root">
			<ul className="-mb-8">
				{activitiesToDisplay.map((activity, activityIdx) => (
					<li key={activity.id}>
						<div className="relative pb-8">
							{activityIdx !== activitiesToDisplay.length - 1 ? (
								<span
									className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
									aria-hidden="true"
								/>
							) : null}
							<div className="relative flex items-start space-x-3">
								<div className="relative">
									<div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
										{getIcon(activity.icon)}
									</div>
								</div>
								<div className="min-w-0 flex-1">
									<div>
										<div className="text-sm">
											<span className="font-medium text-gray-900">
												{activity.description}
											</span>
										</div>
										<p className="mt-0.5 text-sm text-gray-500">
											{formatRelativeTime(
												typeof activity.date === "string"
													? activity.date
													: (activity?.date?.toISOString() ?? ""),
											)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
