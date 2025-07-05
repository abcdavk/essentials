import { Player, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { allJobs } from "./config";
import { calculateNextValue, getActualName } from "../../utils";

export function jobMenuMainUI(player: Player) {
    let playerJob = player.getDynamicProperty("job:currentJob") as number;

    let form = new ActionFormData()
        .title("§f§0§1§r§l§0Job Menu");
    if (player.hasTag("job:hasEmployed") && playerJob !== undefined) {
        let jobTitle = allJobs[playerJob].title;
        form.body(`Hi ${getActualName(player.nameTag)}!\nYour job is §e${jobTitle}\n\n`)
        form.button("Show All Jobs");
        form.button("Job Status");
    } else {
        form.body("Don't have a job yet? Apply job now!");
        form.button("Show All Jobs");
    }
    form.show(player).then(res => {
        if (res.selection === 0) {
            showAllJobs(player);
        }
        if (res.selection === 1) {
            jobStatus(player)
        }
    })
}

function jobStatus(player: Player) {
    let playerJob = player.getDynamicProperty("job:currentJob") as number;

    let jobTitle = allJobs[playerJob].title;
    let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`) as number;
    let jobProgress = player.getDynamicProperty(`job:${jobTitle}_progress`) as number;

    let {
        initialRequirement,
        requirementStep,
        initialReward,
        rewardStep,
        description
    } = allJobs[playerJob];


    let reward = calculateNextValue(jobLevel, initialReward, rewardStep)
    let requirement = calculateNextValue(jobLevel, initialRequirement, requirementStep)


    let form = new ActionFormData()
    .title("§f§0§1§r§l§0Job Status")
    .body(`§eCurrent Job:§r §l${jobTitle}§r
§eDescription:§r ${description}\n
§eLevel:§r ${jobLevel}
§eProgress:§r ${jobProgress}/${requirement}\n
§eReward:§a $${reward}/task\n\n\n\n\n\n
    `)
    form.button("§c§lLeave Job")
    form.show(player).then(res => {
        if (res.canceled) jobMenuMainUI(player);
        if (res.selection === 0)  {
            player.sendMessage(`§cYou are no longer working as §e${jobTitle}!`);

            player.setDynamicProperty("job:currentJob");
            player.removeTag("job:hasEmployed");
            system.runTimeout(() => {
                jobMenuMainUI(player);
            }, 20);
        }
    })
}
  

function showAllJobs(player: Player) {
    let form = new ActionFormData()
        .title("§f§0§0§r§l§0Get a Job!")
        .button("", "textures/ui/new_ui/jobs/J1")
        .button("", "textures/ui/new_ui/jobs/J2")
        .button("", "textures/ui/new_ui/jobs/J3")
        .button("", "textures/ui/new_ui/jobs/J4")
        .button("", "textures/ui/new_ui/jobs/J6")
        .button("", "textures/ui/new_ui/jobs/J5")
    form.show(player).then(res => {
        if (res.canceled) jobMenuMainUI(player);
        if (res.selection !== undefined) {
            hireUI(player, res.selection);
        }
    })
}


function hireUI(player: Player, selection: number) {
    let jobTitle = allJobs[selection].title;
    let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`) as number;
    let jobProgress = player.getDynamicProperty(`job:${jobTitle}_progress`) as number;

    let {
        initialRequirement,
        requirementStep,
        initialReward,
        rewardStep,
        description
    } = allJobs[selection]

    let reward = calculateNextValue(jobLevel, initialReward, rewardStep)
    let requirement = calculateNextValue(jobLevel, initialRequirement, requirementStep)


    let form = new ActionFormData()
        .title(`§f§1§${selection}§r§l§0${jobTitle}`)
        .body(`§eDescription:§r ${description}\n
§eLevel:§r ${jobLevel}
§eProgress:§r ${jobProgress}/${requirement}\n
§eReward:§a $${reward}/task\n\n\n\n\n\n\n
        `)


    if (!player.hasTag("job:hasEmployed")) form.button("Apply Job!");
    form.show(player).then(res => {
        if (res.canceled) showAllJobs(player);
        else if (res.selection === 0) {
            player.sendMessage(`§aYou are applying for a job as a §e${jobTitle}!`);
            player.setDynamicProperty("job:currentJob", selection);
            player.addTag("job:hasEmployed");
            // system.runTimeout(() => {
            //     jobMenuMainUI(player);
            // }, 20);
        }
    });
}