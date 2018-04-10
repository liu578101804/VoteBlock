import { ENFILE } from 'constants';

//导入web3
var Web3 = require('web3');

window.App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    intervalNumber: null,
    //当前价格
    nowGasPrice: 0,

    //初始化工程
    init: function() {
        return App.initWeb3();
    },

    //初始化web3
    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            console.warn("MetaMask");
        }else{
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            console.warn("请使用谷歌浏览器打开此网页，需要安装MetaMask插件，同时连到 Ropsten Test netWork 网络");
        }
        web3 = new Web3(App.web3Provider);


        //获得账号信息
        web3.eth.getCoinbase(function(err,account){
            if(err === null){
                App.account = account;
                $("#accountAddress").html("您当前的账号: " + account);
            }
            return App.initContract();
        });

    },

    //初始化合约
    initContract: function(){

        //合约地址
        var address = '0x073a25684a9408258d1d42de87ee90d5fc6b5deb';
        //合约abi
        var abi = [{"constant":false,"inputs":[{"name":"_candidateId","type":"uint256"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidates","outputs":[{"name":"id","type":"uint256"},{"name":"name","type":"string"},{"name":"voteCount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"voters","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"candidateCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_candidateId","type":"uint256"}],"name":"votedEvent","type":"event"}];
        //获取当前gas价格
        web3.eth.getGasPrice().then(function(instance){
            App.nowGasPrice = instance;

            App.contracts.Election = new web3.eth.Contract(abi,address,{
                from: App.account,
                gasPrice: App.nowGasPrice
            });
            App.contracts.Election.setProvider(App.web3Provider);

            return App.reander();
        });
        
    },

    //渲染界面
    reander: function(){

        var $loader = $("#loader");
        var $content = $("#content");
        var $candidatesResults = $("#candidatesResults");
        var $cadidatesSelect = $("#cadidatesSelect");

        $candidatesResults.empty();
        $cadidatesSelect.empty();

        $loader.show();
        $content.hide();

        App.contracts.Election.methods.candidateCount().call({from: App.account}).then(function(candidatesCount){
           
            //循环去取每一个候选人列表
            for(var i=1;i<=candidatesCount;i++){

                //获取参数
                App.contracts.Election.methods.candidates(i).call({from: App.account},function(err,candidate){
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    var candidateTemplate = "<tr><th>"+id+"</th><td>"+name+"</td><td>"+voteCount+"</td></tr>";
                    $candidatesResults.append(candidateTemplate);

                    //投票
                    var cadidateOption = "<option value='"+id+"'>"+name+"</option>";
                    $cadidatesSelect.append(cadidateOption);
                })

            }

            return App.contracts.Election.methods.voters(App.account).call({from: App.account});

        }).then(function(hasVoted){

            if(hasVoted){
                $("#from-inp").hide();
            }

            $loader.hide();
            $content.show();

        }).catch(function(err){
            console.warn(err);
        });

    },

    //投票
    castVote: function(){

        var $loader = $("#loader");
        var $content = $("#content");
        var candidateId = $('#cadidatesSelect').val();

        App.contracts.Election.methods.vote(candidateId).send({from: App.account},function(error,result){

            if (error){
                console.warn(error);
            }else{
                $loader.show();
                $content.hide();

                $("#loader .test-center").html("请稍等，正在等待节点记录本次交易...");

                //启动监听
                App.listenVotedEventForEvent();
            }
            
        });
    },

    //监听事件
    listenVotedEventForEvent: function(){

        var $loader = $("#loader");
        var $content = $("#content");

        clearInterval(App.intervalNumber);
        
        App.intervalNumber = setInterval(function(){

            App.contracts.Election.getPastEvents('allEvents', {
            }, function(error, events){ 
                
                if(events.length > 0){
                    alert("投票成功，blockNumber为：" + events['0']['blockNumber']);
                    clearInterval(App.intervalNumber);
                    App.reander();
                    $("#loader .test-center").html("加载中...");
                }

                if(error != null){
                    console.warn(error);
                    clearInterval(App.intervalNumber);
                    App.reander();
                }

            });

        },1500);
        
    }

}


window.onload = function(){ 
    App.init();
}



  
